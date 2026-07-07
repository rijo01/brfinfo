import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import { getForvaltareBySlug, formatOrgnr, slugify, isBoxOnlyAddress } from '@/lib/supabase'
import ForvaltareKontaktForm from './ForvaltareKontaktForm'

type Props = { params: Promise<{ slug: string }> }

// On-demand ISR: prerendera INGET vid build, men gör varje slug helsides-cachad
// vid första besöket (MISS→HIT, ~0,1 s efteråt), revalidering var 24:e h.
export const revalidate = 86400
// Skyddsnät: om en kall indexbyggnad tar längre tid ska funktionen inte kapas mitt i.
export const maxDuration = 60

// Tom array = build prerenderar NOLL förvaltar-sidor (inget Supabase-anrop vid
// build → ingen scan, ingen per-sida-timeout som sänkte commit 46af9f0). Men
// genom att generateStaticParams finns + dynamicParams=true (default) behandlas
// on-demand-renders som cachebar ISR → helsides-HIT efter första träffen.
// Återinför ALDRIG en icke-tom array här utan att lösa build-cache-delningen först.
export async function generateStaticParams() {
  return []
}

// Resolverar slugen, ELLER 308:ar en historisk "c-o-"-slug till sin rena form OM
// den rena formen bevisligen ger 200 (getForvaltareBySlug !== null). Annars null → 404.
//
// Bakgrund: före c/o-fixen länkade/indexerades ~2028 rena förvaltare under en
// "c-o-"-slug (rå "c/o X" ur forvaltare-kolumnen). Routen är coAdress-only och 404:ar
// dem nu. Vi 308:ar de rena (c-o-X → X) och låter de ~3772 skräp-slugarna
// (personnamn/felförda BRF, vars strippade form INTE finns i 200-universumet) 404:a.
//
// LOOP-SÄKERHET: redirecten avfyras ENDAST när getForvaltareBySlug(cand) !== null.
// Då renderar /forvaltare/<cand> 200 och når aldrig denna gren → max ETT hopp, aldrig
// en kedja. cand = slug utan "c-o-"-prefix är strikt kortare → kan aldrig peka på sig
// själv. (Empiriskt: 0 av de 2028 målen är själva c-o-prefixade.)
async function resolveForvaltareOrRedirect(slug: string) {
  const data = await getForvaltareBySlug(slug)
  if (data) return data
  if (slug.startsWith('c-o-')) {
    const cand = slug.replace(/^c-o-/, '')
    if (cand && (await getForvaltareBySlug(cand))) {
      permanentRedirect(`/forvaltare/${cand}`) // 308; kastar NEXT_REDIRECT → avbryter render
    }
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await resolveForvaltareOrRedirect(slug)
  if (!data) return { title: 'Förvaltare hittades inte' }
  // Selektiv noindex: bara förvaltare med ≥2 BRF indexeras. Singletons (1 BRF) är
  // tunna/lågkvalitativa (ofta personnamn, kundnummer eller enskild BRF som c/o) och
  // späder ut sajtens kvalitet i Googles ögon → noindex. follow:true så crawlern ändå
  // följer sidans interna länkar till BRF-sidorna (leder crawl mot kärninnehållet).
  // Ren count, ingen junk-heuristik (den felklassar riktiga bolag som SBC/Egeryds).
  // Påverkar VARKEN HTTP-status (sidan är fortsatt 200), redirect-grenen (308 för c-o-
  // kastas redan i resolveForvaltareOrRedirect ovan) ELLER ISR/cache (metan renderas in
  // i samma cachade HTML; data.total kommer ur det redan cachade indexet, ingen ny query).
  return {
    title: `${data.name} — Förvaltare av ${data.total} BRF:er`,
    description: `${data.name} förvaltar ${data.total} bostadsrättsföreningar i Sverige. Se vilka BRF:er de ansvarar för.`,
    alternates: { canonical: `https://brfinfo.se/forvaltare/${slug}` },
    robots: data.total >= 2 ? undefined : { index: false, follow: true },
  }
}

export default async function ForvaltareDetailPage({ params }: Props) {
  const { slug } = await params
  const data = await resolveForvaltareOrRedirect(slug)
  if (!data) notFound()

  const { name, brfs, total } = data
  const card = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 } as React.CSSProperties
  const cardTitle = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 400, color: '#0F1F2D', marginBottom: 16, letterSpacing: '-0.3px' } as React.CSSProperties

  // Group BRFs by city
  const byCity: Record<string, typeof brfs> = {}
  for (const brf of brfs) {
    const city = brf.postort || 'Okänd ort'
    if (!byCity[city]) byCity[city] = []
    byCity[city].push(brf)
  }
  const cities = Object.entries(byCity).sort((a, b) => b[1].length - a[1].length)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Organization',
        name, description: `${name} förvaltar ${total} bostadsrättsföreningar i Sverige.`,
        url: `https://brfinfo.se/forvaltare/${slug}`,
      })}} />

      <div style={{ background: 'white', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', fontSize: 13, color: '#6A8090' }}>
          <Link href="/" style={{ color: '#1B7C6E', textDecoration: 'none' }}>BRFinfo</Link>
          {' → '}
          <Link href="/forvaltare" style={{ color: '#1B7C6E', textDecoration: 'none' }}>Förvaltare</Link>
          {' → '}
          <span>{name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div className="forvaltare-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 8 }}>
                {name}
              </h1>
              <p style={{ fontSize: 15, color: '#6A8090', marginBottom: 20 }}>Förvaltningsbolag</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Antal BRF:er', value: brfs.length < total ? `${brfs.length} av ${total}` : String(total) },
                  { label: 'Antal orter', value: String(cities.length) },
                  { label: 'Största ort', value: cities[0]?.[0] ?? '—' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#F5F1E8', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#0F1F2D' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* BRF List */}
            <div style={card}>
              <h2 style={cardTitle}>BRF:er som förvaltas av {name}</h2>
              {cities.map(([city, cityBrfs]) => (
                <div key={city} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 500, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                    {city} ({cityBrfs.length})
                  </h3>
                  {cityBrfs.map((brf, i) => (
                    <Link
                      key={brf.orgnr}
                      href={`/brf/${brf.slug}`}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: i < cityBrfs.length - 1 ? '1px solid rgba(15,31,45,0.05)' : 'none',
                        textDecoration: 'none',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#0F1F2D' }}>{brf.namn}</span>
                        {/* Rena box-adresser ("Box 203") döljs i listvyn — de säger inget om läget. Endast display. */}
                        {brf.adress && !isBoxOnlyAddress(brf.adress) && <span style={{ fontSize: 13, color: '#8A9BAB', marginLeft: 8 }}>{brf.adress}</span>}
                      </div>
                      <span style={{ fontSize: 12, color: '#1B7C6E', fontFamily: 'monospace' }}>{formatOrgnr(brf.orgnr)}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Partner CTA */}
            <div style={{ ...card, background: '#F5F1E8', border: 'none' }}>
              <h2 style={{ ...cardTitle, fontSize: 16 }}>Representerar du {name}?</h2>
              <p style={{ fontSize: 13, color: '#4A6070', lineHeight: 1.6, marginBottom: 14 }}>
                Vi utvecklar ett partnerprogram för förvaltare på BRFinfo.se. Lämna en intresseanmälan så hör vi av oss när det lanseras — era behov är med och formar vad vi bygger.
              </p>
              <Link href="/forvaltare-partner" style={{ display: 'inline-block', background: '#C9932A', color: '#0F1F2D', padding: '10px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>
                Läs mer →
              </Link>
            </div>

            {/* Contact Form */}
            <div style={card}>
              <h2 style={{ ...cardTitle, fontSize: 16 }}>Kontakta oss</h2>
              <ForvaltareKontaktForm forvaltareName={name} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
