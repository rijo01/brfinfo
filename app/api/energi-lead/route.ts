import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Kör alltid dynamiskt; initiera ALDRIG klienten på modulnivå.
export const dynamic = 'force-dynamic'

const INTRESSEN = ['solceller', 'varmepump', 'fonster', 'energikartlaggning', 'annat']

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  const email = String(body.kontakt_email ?? '').trim()
  const intresse = String(body.intresse ?? '').trim()

  // Minimal validering — lead-capture, inte ett auth-flöde.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Ange en giltig e-postadress.' }, { status: 400 })
  }
  if (intresse && !INTRESSEN.includes(intresse)) {
    return NextResponse.json({ error: 'Ogiltigt intresseval.' }, { status: 400 })
  }
  // Enkel honeypot mot bottar.
  if (body.company) {
    return NextResponse.json({ ok: true })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Tjänsten är inte konfigurerad.' }, { status: 503 })
  }

  const supabase = createClient(url, key)
  const { error } = await supabase.from('energi_leads').insert({
    orgnr: body.orgnr ? String(body.orgnr) : null,
    brf_namn: body.brf_namn ? String(body.brf_namn) : null,
    kommun: body.kommun ? String(body.kommun) : null,
    intresse: intresse || null,
    kontakt_email: email,
    kontakt_telefon: body.kontakt_telefon ? String(body.kontakt_telefon) : null,
    meddelande: body.meddelande ? String(body.meddelande) : null,
    kalla: body.kalla ? String(body.kalla) : 'brf-sida',
    status: 'ny',
  })

  if (error) {
    return NextResponse.json({ error: 'Kunde inte spara. Försök igen.' }, { status: 500 })
  }

  // Valfri notis till Rickard om RESEND_API_KEY finns (inget externt utskick krävs i MVP).
  const resendKey = process.env.RESEND_API_KEY
  const notify = process.env.ENERGI_LEAD_NOTIFY_EMAIL
  if (resendKey && notify) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'BRFinfo <leads@brfinfo.se>',
          to: notify,
          subject: `Ny energi-lead: ${body.brf_namn ?? 'okänd BRF'}`,
          text: `BRF: ${body.brf_namn}\nKommun: ${body.kommun}\nIntresse: ${intresse}\nE-post: ${email}\nTelefon: ${body.kontakt_telefon ?? '-'}\nMeddelande: ${body.meddelande ?? '-'}`,
        }),
      })
    } catch {
      // Notis är best-effort; leaden är redan sparad.
    }
  }

  return NextResponse.json({ ok: true })
}
