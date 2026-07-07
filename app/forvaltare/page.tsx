import type { Metadata } from 'next'
import Link from 'next/link'
import { getForvaltareList, displayForvaltareName } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Förvaltare — Alla förvaltningsbolag för BRF:er i Sverige',
  description: 'Se vilka förvaltningsbolag som förvaltar flest bostadsrättsföreningar i Sverige. Hitta din förvaltare och se alla BRF:er de ansvarar för.',
  alternates: { canonical: 'https://brfinfo.se/forvaltare' },
}

export default async function ForvaltarePage() {
  const forvaltare = await getForvaltareList()

  const card = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 } as React.CSSProperties

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: 'Förvaltningsbolag för BRF:er i Sverige',
        description: 'Lista över alla förvaltningsbolag som förvaltar bostadsrättsföreningar i Sverige.',
        url: 'https://brfinfo.se/forvaltare',
      })}} />

      <div style={{ background: 'white', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', fontSize: 13, color: '#6A8090' }}>
          <Link href="/" style={{ color: '#1B7C6E', textDecoration: 'none' }}>BRFinfo</Link>
          {' → '}
          <span>Förvaltare</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 400, color: '#0F1F2D', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 8 }}>
          Förvaltningsbolag
        </h1>
        <p style={{ fontSize: 15, color: '#6A8090', marginBottom: 32, lineHeight: 1.6 }}>
          {forvaltare.length} förvaltningsbolag förvaltar BRF:er registrerade på BRFinfo.se. Rangordnade efter antal förvaltade föreningar.
        </p>

        <div style={card}>
          {forvaltare.map((f, i) => (
            <Link
              key={f.slug}
              href={`/forvaltare/${f.slug}`} /* slug oförändrad — endast visningsnamnet städas */
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0',
                borderBottom: i < forvaltare.length - 1 ? '1px solid rgba(15,31,45,0.05)' : 'none',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#8A9BAB', fontFamily: 'monospace', minWidth: 32 }}>{i + 1}.</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#0F1F2D' }}>{displayForvaltareName(f.name)}</span>
              </div>
              <span style={{ fontSize: 13, color: '#1B7C6E', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {f.count} BRF:er →
              </span>
            </Link>
          ))}
        </div>

        {/* CTA for forvaltare */}
        <div style={{ background: '#F5F1E8', borderRadius: 12, padding: '32px 28px', textAlign: 'center', marginTop: 24 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 8 }}>
            Är du förvaltare?
          </h2>
          <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.6, marginBottom: 16 }}>
            Bli partner på BRFinfo.se och nå tusentals styrelser. Kontaktuppgifter, logotyp och direktlänk till era BRF:er.
          </p>
          <Link href="/forvaltare-partner" style={{ display: 'inline-block', background: '#C9932A', color: '#0F1F2D', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
            Bli partner — från 490 kr/mån
          </Link>
        </div>
      </div>
    </>
  )
}
