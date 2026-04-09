'use client'
import Link from 'next/link'
import { BRF, avgift, bildadAr, formatOrgnr, initials } from '@/lib/supabase'

const COLORS = ['#0F1F2D', '#1B7C6E', '#1A3045', '#2A5C4A', '#3B4A6B']

export default function BRFCard({ brf }: { brf: BRF }) {
  const color = COLORS[parseInt(brf.orgnr.replace(/\D/g, ''), 10) % COLORS.length]
  const init = initials(brf.namn)
  const fee = avgift(brf)
  const year = bildadAr(brf.startdatum)
  const orgnr = formatOrgnr(brf.orgnr)
  const forvaltare = (brf as any).forvaltare?.replace(/^c\/o\s+/i, '').trim() || null

  return (
    <Link href={`/brf/${brf.slug}`} style={{ textDecoration: 'none' }}>
      <article
        style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s ease', height: '100%' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 32px rgba(15,31,45,0.1)'; el.style.borderColor = '#1B7C6E' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = 'rgba(15,31,45,0.09)' }}
        itemScope itemType="https://schema.org/Organization"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 13, fontWeight: 600, color: 'white' }}>
            {init}
          </div>
          {brf.verified && (
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(27,124,110,0.1)', color: '#1B7C6E', fontWeight: 500 }}>Verifierad</span>
          )}
        </div>
        <h3 itemProp="name" style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 400, color: '#0F1F2D', marginBottom: 3, lineHeight: 1.3 }}>{brf.namn}</h3>
        <p style={{ fontSize: 12, color: '#8A9BAB', marginBottom: 12 }}>{orgnr}{year !== 'Okänt' && ` · Bildad ${year}`}</p>
        <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A2B38' }}>{fee}</div>
            <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Avg/kvm</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: brf.status === 'AKTIV' ? '#1B7C6E' : '#C9932A' }}>{brf.status === 'AKTIV' ? 'Aktiv' : (brf.status ?? '—')}</div>
            <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#4A6070' }}>
          <span style={{ width: 6, height: 6, background: '#23A090', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
          <span itemProp="addressLocality">{brf.postort}</span>
          {brf.kommun && brf.kommun !== brf.postort && <span style={{ color: '#8A9BAB' }}>· {brf.kommun}</span>}
        </div>
        {forvaltare && (
          <div style={{ marginTop: 10, fontSize: 11.5, color: '#6A8090', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#8A9BAB' }}>Förvaltas av</span>
            <span style={{ fontWeight: 500, color: '#4A6070' }}>{forvaltare}</span>
          </div>
        )}
        <div style={{ borderTop: '1px solid rgba(15,31,45,0.06)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: '#1B7C6E', fontWeight: 500 }}>Visa profil →</span>
          {brf.lan && <span style={{ fontSize: 11, background: 'rgba(27,124,110,0.07)', color: '#1B7C6E', padding: '3px 8px', borderRadius: 4 }}>{brf.lan.replace(' län', '')}</span>}
        </div>
      </article>
    </Link>
  )
}
