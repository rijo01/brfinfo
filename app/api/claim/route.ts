import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// Kör alltid dynamiskt; initiera ALDRIG klienten på modulnivå.
export const dynamic = 'force-dynamic'

// Claim-ansökningar är intern data — brf_claims har RLS på utan policys, så
// anon-nyckeln kommer inte in. Den här routen kör med service role och är
// därför den ENDA vägen in i tabellen. Nyckeln lämnar aldrig servern.
//
// FÖRUTSÄTTER att db/utskick_schema.sql Block 1 + 5 är körda. Deploya inte
// före det — annars svarar routen 503 och /claima blir obrukbar.

const ROLLER = ['Ordförande', 'Kassör', 'Sekreterare', 'Ledamot', 'Suppleant', 'Annan']

// Rate limiting mot brf_claims. Ingen Redis i stacken, och in-memory-räknare
// överlever inte att Fluid Compute snurrar upp en ny instans — men tabellen
// gör det. Två spärrar med olika syfte:
const MAX_PER_IP_PER_TIMME = 3      // stoppar den som spammar formuläret
const MAX_PER_ORGNR_PER_DYGN = 2    // stoppar riktad spam mot EN förening

function klientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'okand'
}

// IP är en personuppgift. Vi behöver bara kunna RÄKNA per avsändare, inte veta
// vem det är — så vi lagrar en hash och aldrig adressen. Utan salt vore hashen
// trivialt återvändbar (IPv4 har bara 4 miljarder möjligheter).
//
// CLAIM_IP_SALT är inte satt i Vercel ännu (UTSKICK.md steg 5). Tomt salt hade
// gjort exakt det kommentaren varnar för, så vi faller tillbaka på en nyckel som
// bara finns på servern och redan är hemlig. Den är inte lika bra som ett eget
// salt — roteras service-nyckeln byter alla hashar värde och rate limit-fönstren
// nollställs, vilket är ofarligt men slösaktigt. Sätt CLAIM_IP_SALT.
function ipSalt(): string {
  const explicit = process.env.CLAIM_IP_SALT
  if (explicit) return explicit
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (fallback) return createHash('sha256').update(`claim-ip-salt:${fallback}`).digest('hex')
  return ''
}

function ipHash(ip: string): string {
  return createHash('sha256').update(`${ipSalt()}:${ip}`).digest('hex')
}

function normaliseraOrgnr(raw: string): string | null {
  const siffror = raw.replace(/\D/g, '')
  if (siffror.length !== 10) return null
  return siffror
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  // Honeypot — samma konvention som app/api/energi-lead/route.ts. Fältet är
  // dolt i formuläret; bara bottar fyller i det. Svara 200 så att boten tror
  // att den lyckades och inte provar en annan väg.
  if (body.company) {
    return NextResponse.json({ ok: true })
  }

  const orgnr = normaliseraOrgnr(String(body.orgnr ?? ''))
  const namn = String(body.namn ?? '').trim()
  const email = String(body.email ?? '').trim()
  const roll = String(body.roll ?? '').trim()

  if (!orgnr) {
    return NextResponse.json({ error: 'Ange ett giltigt org.nr (10 siffror).' }, { status: 400 })
  }
  if (!namn || namn.length > 120) {
    return NextResponse.json({ error: 'Ange ditt namn.' }, { status: 400 })
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    return NextResponse.json({ error: 'Ange en giltig e-postadress.' }, { status: 400 })
  }
  if (roll && !ROLLER.includes(roll)) {
    return NextResponse.json({ error: 'Ogiltig roll.' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Tjänsten är inte konfigurerad.' }, { status: 503 })
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const hash = ipHash(klientIp(req))
  const enTimmeSedan = new Date(Date.now() - 3600_000).toISOString()
  const ettDygnSedan = new Date(Date.now() - 86_400_000).toISOString()

  // ── Spärr 1: per avsändare ────────────────────────────────────────────────
  const { count: ipCount, error: ipErr } = await supabase
    .from('brf_claims')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', hash)
    .gte('created_at', enTimmeSedan)

  // Fail closed. Kan vi inte kontrollera taket vet vi inte om det är passerat —
  // och en trasig räkning får inte bli en öppen dörr.
  if (ipErr) {
    return NextResponse.json({ error: 'Kunde inte spara. Försök igen.' }, { status: 500 })
  }
  if ((ipCount ?? 0) >= MAX_PER_IP_PER_TIMME) {
    return NextResponse.json(
      { error: 'För många ansökningar från samma nätverk. Försök igen om en timme.' },
      { status: 429 },
    )
  }

  // ── Spärr 2: per förening ─────────────────────────────────────────────────
  const { count: orgCount, error: orgErr } = await supabase
    .from('brf_claims')
    .select('id', { count: 'exact', head: true })
    .eq('orgnr', orgnr)
    .gte('created_at', ettDygnSedan)

  if (orgErr) {
    return NextResponse.json({ error: 'Kunde inte spara. Försök igen.' }, { status: 500 })
  }
  if ((orgCount ?? 0) >= MAX_PER_ORGNR_PER_DYGN) {
    return NextResponse.json(
      { error: 'Det finns redan en ansökan för den här föreningen. Vi hör av oss.' },
      { status: 429 },
    )
  }

  // ── Spara ansökan ─────────────────────────────────────────────────────────
  const { error: insertErr } = await supabase.from('brf_claims').insert({
    orgnr,
    brf_namn: body.brf_namn ? String(body.brf_namn).slice(0, 200) : null,
    namn,
    roll: roll || null,
    email,
    telefon: body.telefon ? String(body.telefon).slice(0, 40) : null,
    meddelande: body.meddelande ? String(body.meddelande).slice(0, 2000) : null,
    status: 'ny',
    ip_hash: hash,
  })

  if (insertErr) {
    return NextResponse.json({ error: 'Kunde inte spara. Försök igen.' }, { status: 500 })
  }

  // ── Sätt claim_status på brf_utskick ──────────────────────────────────────
  // UPDATE först, INSERT bara om raden saknas. En upsert hade skrivit över
  // email med null för de ~2 200 föreningar som redan ligger i segmentet —
  // och därmed tyst plockat bort dem ur sändkön.
  //
  // Skriv aldrig över ett slutgiltigt tillstånd: en redan verifierad förening
  // ska inte falla tillbaka till 'ansokan_inne' för att någon annan ansöker.
  const { count: uppdaterade } = await supabase
    .from('brf_utskick')
    .update({ claim_status: 'ansokan_inne', uppdaterad_at: new Date().toISOString() }, { count: 'exact' })
    .eq('orgnr', orgnr)
    .eq('claim_status', 'ej_claimad')

  if ((uppdaterade ?? 0) === 0) {
    // Antingen finns ingen rad (förening utanför segmentet) eller så har den
    // redan ett annat claim_status. Insert:en är ofarlig i båda fallen:
    // ignoreDuplicates gör den till en no-op om raden fanns.
    await supabase
      .from('brf_utskick')
      .upsert({ orgnr, claim_status: 'ansokan_inne' }, { onConflict: 'orgnr', ignoreDuplicates: true })
  }

  // ── Notis till Rickard (behålls) ──────────────────────────────────────────
  // Best-effort: ansökan är redan sparad i databasen. Att notisen inte går
  // fram får aldrig få formuläret att se ut att ha misslyckats.
  //
  // Best-effort får INTE betyda tyst. Saknas nyckel eller mottagare, eller
  // svarar Resend med fel, så skriver vi en rad i Vercel-loggen med orgnr så att
  // ansökan går att hitta i brf_claims. En notis som försvinner utan spår är
  // värre än ingen notis alls — då tror man att inga ansökningar kommit in.
  const resendKey = process.env.RESEND_API_KEY
  const notify = process.env.CLAIM_NOTIFY_EMAIL ?? process.env.ENERGI_LEAD_NOTIFY_EMAIL
  if (!resendKey || !notify) {
    console.error(
      `[claim] NOTIS EJ SKICKAD — ${!resendKey ? 'RESEND_API_KEY' : 'CLAIM_NOTIFY_EMAIL'} saknas. ` +
      `Ansökan ÄR sparad: select * from brf_claims where orgnr = '${orgnr}' order by created_at desc limit 1;`,
    )
  } else {
    try {
      const svar = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'BRFinfo <claims@brfinfo.se>',
          to: notify,
          subject: `Ny claim-ansökan: ${body.brf_namn ?? orgnr}`,
          text: [
            `BRF: ${body.brf_namn ?? '-'}`,
            `Org.nr: ${orgnr}`,
            `Namn: ${namn}`,
            `Roll: ${roll || '-'}`,
            `E-post: ${email}`,
            `Telefon: ${body.telefon ?? '-'}`,
            `Meddelande: ${body.meddelande ?? '-'}`,
            '',
            `Granska: select * from brf_claims where orgnr = '${orgnr}' order by created_at desc;`,
          ].join('\n'),
        }),
      })
      if (!svar.ok) {
        console.error(
          `[claim] NOTIS AVVISAD av Resend (HTTP ${svar.status}) för orgnr ${orgnr}. ` +
          `Ansökan ÄR sparad i brf_claims.`,
        )
      }
    } catch (e) {
      // Notisen är best-effort; ansökan ligger redan i brf_claims. Men den ska
      // synas i loggen, inte sväljas.
      console.error(
        `[claim] NOTIS MISSLYCKADES (${e instanceof Error ? e.name : 'okänt fel'}) för orgnr ${orgnr}. ` +
        `Ansökan ÄR sparad i brf_claims.`,
      )
    }
  }

  return NextResponse.json({ ok: true })
}
