import type { Metadata } from 'next'
import Link from 'next/link'
import { searchBRFs, getBRFsByCity } from '@/lib/supabase'
import BRFCard from '@/components/BRFCard'
import SearchBox from '@/components/SearchBox'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ q?: string; stad?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Sökresultat för "${q}" — BRFinfo.se` : 'Sök BRF — BRFinfo.se',
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', stad = '' } = await searchParams
  let results: any[] = []
  let searchError: string | null = null
  if (q) {
    try {
      results = await searchBRFs(q, 40)
    } catch(e: any) {
      searchError = e.message
    }
  }
  else if (stad) results = await getBRFsByCity(stad, 40)

  return (
    <div>
      <div style={{ background: '#0F1F2D', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 300, color: 'white', marginBottom: 20, letterSpacing: '-0.5px' }}>
            {q ? `Sökresultat för "${q}"` : stad ? `BRF:er i ${stad}` : 'Sök bostadsrättsförening'}
          </h1>
          <SearchBox />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {searchError && (
          <p style={{ fontSize: 14, color: 'red', marginBottom: 24 }}>FEL: {searchError}</p>
        )}
        {(q || stad) && (
          <p style={{ fontSize: 14, color: '#6A8090', marginBottom: 24 }}>
            {results.length > 0 ? `Visar ${results.length} BRF:er` : 'Inga BRF:er hittades.'}
          </p>
        )}

        {!q && !stad && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 16, color: '#6A8090', marginBottom: 24 }}>Skriv ett BRF-namn, org.nr eller adress ovan.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Brf Storken', 'Brf Hornsgatan', 'Brf Olivedal', 'Möllevången'].map(hint => (
                <Link key={hint} href={`/sok?q=${encodeURIComponent(hint)}`} style={{ background: 'white', border: '1px solid rgba(15,31,45,0.1)', color: '#1B7C6E', padding: '8px 16px', borderRadius: 20, fontSize: 13.5, textDecoration: 'none', fontWeight: 500 }}>{hint}</Link>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {results.map((brf: any) => <BRFCard key={brf.orgnr} brf={brf} />)}
          </div>
        )}
      </div>
    </div>
  )
}
