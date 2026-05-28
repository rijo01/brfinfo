import type { Metadata } from 'next'
import Link from 'next/link'
import { getEnergiByKommun } from '@/lib/energi'
import EnergiKatalogTabell from '@/components/EnergiKatalogTabell'

type Props = { params: Promise<{ stad: string }> }

// Slug → kommunnamn (som det står i foretag.kommun). Pilot: Stockholm.
const STAD_KOMMUN: Record<string, string> = {
  stockholm: 'Stockholm',
  goteborg: 'Göteborg',
  malmo: 'Malmö',
  uppsala: 'Uppsala',
}

function kommunFromSlug(slug: string): string {
  return STAD_KOMMUN[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stad } = await params
  const kommun = kommunFromSlug(stad)
  return {
    title: `Energiklass för BRF:er i ${kommun} — energideklarationer`,
    description: `Bostadsrättsföreningar i ${kommun} med registrerad energideklaration. Jämför energiklass A–G och primärenergital. Data från Boverket.`,
    alternates: { canonical: `https://brfinfo.se/energiklass/${stad}` },
  }
}

export default async function EnergiklassStadPage({ params }: Props) {
  const { stad } = await params
  const kommun = kommunFromSlug(stad)
  const poster = await getEnergiByKommun(kommun, 500)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: `Energiklass för BRF:er i ${kommun}`, url: `https://brfinfo.se/energiklass/${stad}`,
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BRFinfo', item: 'https://brfinfo.se' },
          { '@type': 'ListItem', position: 2, name: 'Energideklaration', item: 'https://brfinfo.se/energideklaration' },
          { '@type': 'ListItem', position: 3, name: `Energiklass i ${kommun}`, item: `https://brfinfo.se/energiklass/${stad}` },
        ] },
      }) }} />

      <div style={{ background: 'white', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 24px', fontSize: 13, color: '#6A8090' }}>
          <Link href="/" style={{ color: '#1B7C6E', textDecoration: 'none' }}>BRFinfo</Link>{' → '}
          <Link href="/energideklaration" style={{ color: '#1B7C6E', textDecoration: 'none' }}>Energideklaration</Link>{' → '}
          <span>Energiklass i {kommun}</span>
        </div>
      </div>

      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '44px 24px 52px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(26px,5vw,42px)', fontWeight: 300, color: 'white', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 12 }}>
            Energiklass för BRF:er i <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>{kommun}</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6, maxWidth: 600 }}>
            {poster.length > 0
              ? `${poster.length.toLocaleString('sv-SE')} föreningar med registrerad energideklaration. Sortera på energiklass eller primärenergital.`
              : 'Här visas föreningar med registrerad energideklaration så snart datan är inläst.'}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        {poster.length > 0 ? (
          <EnergiKatalogTabell poster={poster} />
        ) : (
          <div style={{ background: 'white', border: '1px dashed rgba(15,31,45,0.15)', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6A8090' }}>
            <p style={{ marginBottom: 12, fontSize: 15 }}>Inga energideklarationer inlästa för {kommun} ännu.</p>
            <Link href="/energideklaration" style={{ color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>Läs om energideklarationer för BRF:er →</Link>
          </div>
        )}

        <section style={{ maxWidth: 720, marginTop: 40 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 400, color: '#0F1F2D', marginBottom: 10 }}>Om energiklasserna</h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7 }}>
            Energiklassen (A–G) baseras på byggnadens primärenergital i kWh per kvadratmeter och år, enligt Boverkets register. A är lägst energianvändning, G högst. <Link href="/energideklaration" style={{ color: '#1B7C6E', textDecoration: 'none' }}>Läs mer om vad energiklass betyder →</Link>
          </p>
        </section>
      </div>
    </>
  )
}
