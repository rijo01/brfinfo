import type { Metadata } from 'next'
import Link from 'next/link'
import { getBRFsByCity, getBRFCountByCity } from '@/lib/supabase'
import { stadTitle, stadDescription } from '@/lib/seo'
import { META } from '@/lib/stader'
import BRFCard from '@/components/BRFCard'
import SearchBox from '@/components/SearchBox'

type Props = { params: Promise<{ city: string }> }

// ISR: prerendera de kända städerna vid build (en count-query per stad), revalidera dagligen.
export const revalidate = 86400
export function generateStaticParams() {
  return Object.keys(META).map(city => ({ city }))
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const m = META[city]
  const name = m?.name ?? city
  // Samma memoiserade anrop som sidkomponenten gör — se getBRFCountByCity.
  // Antalet stod redan i brödtexten men saknades i snippeten, vilket var den
  // enskilt största outnyttjade CTR-hävstången på stad-sidorna.
  const count = await getBRFCountByCity(name)
  return {
    // absolute: mallen i layouten får inte lägga på suffixet en gång till.
    title: { absolute: stadTitle(name, count) },
    // "styrelseinfo" är borta ur mallen — sajten har ingen styrelsedata.
    description: stadDescription(name, count, m?.areas),
    alternates: { canonical: `https://brfinfo.se/stad/${city}` },
  }
}

export default async function CityPage({ params }: Props) {
  const { city } = await params
  const meta = META[city]
  const cityName = meta?.name ?? city
  const brfs = await getBRFsByCity(cityName, 30)
  const count = await getBRFCountByCity(cityName)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: `BRF i ${cityName}`, url: `https://brfinfo.se/stad/${city}`,
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BRFinfo', item: 'https://brfinfo.se' },
          { '@type': 'ListItem', position: 2, name: `BRF i ${cityName}`, item: `https://brfinfo.se/stad/${city}` },
        ]},
      })}} />

      <div style={{ background: 'white', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', fontSize: 13, color: '#6A8090' }}>
          <Link href="/" style={{ color: '#1B7C6E', textDecoration: 'none' }}>BRFinfo</Link>{' → '}<span>BRF i {cityName}</span>
        </div>
      </div>

      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(28px,5vw,46px)', fontWeight: 300, color: 'white', letterSpacing: '-1px', marginBottom: 12 }}>
            BRF i <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>{cityName}</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 28, maxWidth: 520, lineHeight: 1.6 }}>{meta?.desc}</p>
          <SearchBox />
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {meta?.areas && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 16 }}>Sök per stadsdel i {cityName}</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {meta.areas.map(area => (
                <Link key={area} href={`/sok?q=${encodeURIComponent(area)}`} style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 8, padding: '8px 14px', fontSize: 13.5, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>{area}</Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D' }}>BRF:er i {cityName}</h2>
          <Link href={`/sok?q=${encodeURIComponent(cityName)}`} style={{ fontSize: 14, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }}>Sök bland alla →</Link>
        </div>

        {brfs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, marginBottom: 48 }}>
            {brfs.map(brf => <BRFCard key={brf.orgnr} brf={brf} />)}
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: 40, textAlign: 'center', color: '#6A8090', marginBottom: 48 }}>
            <p style={{ marginBottom: 12 }}>Inga BRF:er hittades via direktsökning.</p>
            <Link href={`/sok?q=${encodeURIComponent(cityName)}`} style={{ display: 'inline-block', background: '#1B7C6E', color: 'white', padding: '9px 20px', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Sök på &quot;{cityName}&quot;</Link>
          </div>
        )}

        <section style={{ maxWidth: 720 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12 }}>Bostadsrättsföreningar i {cityName}</h2>
          <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7 }}>
            I {cityName} finns det{count != null && count > 0 ? ` ${count.toLocaleString('sv-SE')}` : ' flera'} registrerade bostadsrättsföreningar i vårt register. BRFinfo.se samlar dem med data från Bolagsverket och SCB.
          </p>
        </section>
      </div>
    </>
  )
}
