import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getForvaltareBySlug, formatOrgnr, slugify } from '@/lib/supabase'
import ForvaltareKontaktForm from './ForvaltareKontaktForm'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getForvaltareBySlug(slug)
  if (!data) return { title: 'Förvaltare hittades inte' }
  return {
    title: `${data.name} — Förvaltare av ${data.brfs.length} BRF:er`,
    description: `${data.name} förvaltar ${data.brfs.length} bostadsrättsföreningar i Sverige. Se vilka BRF:er de ansvarar för.`,
    alternates: { canonical: `https://brfinfo.se/forvaltare/${slug}` },
  }
}

export default async function ForvaltareDetailPage({ params }: Props) {
  const { slug } = await params
  const data = await getForvaltareBySlug(slug)
  if (!data) notFound()

  const { name, brfs } = data
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
        name, description: `${name} förvaltar ${brfs.length} bostadsrättsföreningar i Sverige.`,
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 8 }}>
                {name}
              </h1>
              <p style={{ fontSize: 15, color: '#6A8090', marginBottom: 20 }}>Förvaltningsbolag</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: 'Antal BRF:er', value: String(brfs.length) },
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
                        {brf.adress && <span style={{ fontSize: 13, color: '#8A9BAB', marginLeft: 8 }}>{brf.adress}</span>}
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
                Bli partner på BRFinfo.se. Få kontaktuppgifter, logotyp och en verifierad profil synlig för tusentals styrelser.
              </p>
              <div style={{ fontSize: 13, color: '#6A8090', marginBottom: 4 }}>Partnerskap från</div>
              <div style={{ fontSize: 28, fontFamily: 'Fraunces, Georgia, serif', fontWeight: 400, color: '#0F1F2D', marginBottom: 16 }}>
                299 <span style={{ fontSize: 14, color: '#6A8090' }}>kr/mån</span>
              </div>
              <ul style={{ fontSize: 13, color: '#4A6070', lineHeight: 2, paddingLeft: 16, marginBottom: 16 }}>
                <li>Verifierad profil med logotyp</li>
                <li>Kontaktuppgifter synliga</li>
                <li>Direktlänk till er webbplats</li>
                <li>Prioriterad listning</li>
              </ul>
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
