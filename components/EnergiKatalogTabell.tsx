'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { EnergiBadge } from '@/components/EnergiFakta'
import { fmtKwh, type EnergiKatalogPost } from '@/lib/energi'

type SortKey = 'klass' | 'primar' | 'namn'
const ORD = ['A0', 'A', 'B', 'C', 'D', 'E', 'F', 'G']

export default function EnergiKatalogTabell({ poster }: { poster: EnergiKatalogPost[] }) {
  const [sort, setSort] = useState<SortKey>('klass')

  const sorterad = useMemo(() => {
    const arr = [...poster]
    if (sort === 'namn') {
      arr.sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
    } else if (sort === 'primar') {
      arr.sort((a, b) => (a.primarenergital_kwh ?? Infinity) - (b.primarenergital_kwh ?? Infinity))
    } else {
      arr.sort((a, b) => {
        const ia = a.energiklass ? ORD.indexOf(a.energiklass.toUpperCase()) : 99
        const ib = b.energiklass ? ORD.indexOf(b.energiklass.toUpperCase()) : 99
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
      })
    }
    return arr
  }, [poster, sort])

  const btn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSort(key)}
      style={{
        background: sort === key ? '#1B7C6E' : 'white',
        color: sort === key ? 'white' : '#4A6070',
        border: '1px solid rgba(15,31,45,0.12)', borderRadius: 8, padding: '7px 14px',
        fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >{label}</button>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: 4 }}>Sortera:</span>
        {btn('klass', 'Energiklass')}
        {btn('primar', 'Primärenergital')}
        {btn('namn', 'Namn A–Ö')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorterad.map(post => (
          <Link
            key={post.orgnr}
            href={`/brf/${post.slug}`}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 10, padding: '12px 16px', textDecoration: 'none' }}
          >
            <EnergiBadge klass={post.energiklass} size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: '#0F1F2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.namn}</div>
              {post.adress && <div style={{ fontSize: 12.5, color: '#8A9BAB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.adress}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2B38' }}>{post.primarenergital_kwh != null ? fmtKwh(post.primarenergital_kwh) : '—'}</div>
              <div style={{ fontSize: 11, color: '#8A9BAB' }}>primärenergital</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
