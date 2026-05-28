import Link from 'next/link'
import { Energideklaration, energiklassFarg, fmtKwh, fmtDatum } from '@/lib/energi'

export function EnergiBadge({ klass, size = 'md' }: { klass: string | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
  const farg = energiklassFarg(klass)
  const dim = size === 'lg' ? 56 : size === 'sm' ? 28 : 40
  const fs = size === 'lg' ? 28 : size === 'sm' ? 15 : 22
  return (
    <span
      aria-label={`Energiklass ${klass ?? 'okänd'}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: dim, height: dim, borderRadius: 8, background: farg, color: 'white', fontWeight: 700, fontSize: fs, fontFamily: 'Fraunces, Georgia, serif', flexShrink: 0 }}
    >
      {klass ?? '?'}
    </span>
  )
}

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const cardTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 400, color: '#0F1F2D', marginBottom: 16, letterSpacing: '-0.3px' }

// Server-renderad faktakort. Visar ENDAST registrets faktiska värden — inga
// uppskattade besparings-/skattesiffror (YMYL).
export function EnergiFakta({ d }: { d: Energideklaration }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Primärenergital', value: fmtKwh(d.primarenergital_kwh) },
    { label: 'Energiprestanda', value: fmtKwh(d.energiprestanda_kwh) },
    { label: 'Specifik energianvändning', value: fmtKwh(d.specifik_energianvandning_kwh) },
    { label: 'Byggnadsår', value: d.byggnadsar ? String(d.byggnadsar) : '—' },
    { label: 'Deklaration utförd', value: fmtDatum(d.utford) },
    { label: 'Giltig t.o.m.', value: fmtDatum(d.giltig_tom) },
  ]
  if (d.fastighetsbeteckning) rows.unshift({ label: 'Fastighetsbeteckning', value: d.fastighetsbeteckning })
  if (d.radonmatning) rows.push({ label: 'Radonmätning', value: d.radonmatning })
  if (d.ventilationskontroll) rows.push({ label: 'Ventilationskontroll (OVK)', value: d.ventilationskontroll })

  return (
    <div style={card}>
      <h2 style={cardTitle}>Energideklaration</h2>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <EnergiBadge klass={d.energiklass} size="lg" />
        <div>
          <div style={{ fontSize: 13, color: '#6A8090', marginBottom: 2 }}>Energiklass</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#0F1F2D' }}>{d.energiklass ?? 'Okänd'}</div>
        </div>
        {d.primarenergital_kwh != null && (
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: 13, color: '#6A8090', marginBottom: 2 }}>Primärenergital</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#0F1F2D' }}>{fmtKwh(d.primarenergital_kwh)}</div>
          </div>
        )}
      </div>
      {rows.map((r, i, arr) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(15,31,45,0.05)' : 'none', fontSize: 14, gap: 12 }}>
          <span style={{ color: '#6A8090' }}>{r.label}</span>
          <span style={{ fontWeight: 500, color: '#1A2B38', textAlign: 'right' }}>{r.value}</span>
        </div>
      ))}
      <p style={{ fontSize: 12, color: '#8A9BAB', marginTop: 14, lineHeight: 1.5 }}>
        Källa: <a href="https://www.boverket.se/sv/om-boverket/oppna-data/publikt-api-for-energideklarationer/" target="_blank" rel="noopener noreferrer" style={{ color: '#1B7C6E', textDecoration: 'none' }}>Boverkets energideklarationsregister</a>. <Link href="/energideklaration" style={{ color: '#1B7C6E', textDecoration: 'none' }}>Vad betyder detta?</Link>
      </p>
    </div>
  )
}

export function EnergiEjRegistrerad() {
  return (
    <div style={{ ...card, borderStyle: 'dashed', background: 'rgba(15,31,45,0.02)' }}>
      <h2 style={cardTitle}>Energideklaration</h2>
      <p style={{ fontSize: 14, color: '#6A8090', lineHeight: 1.6 }}>
        Energideklaration ej registrerad för denna förening i vårt urval. <Link href="/energideklaration" style={{ color: '#1B7C6E', textDecoration: 'none' }}>Läs om energideklarationer för BRF:er →</Link>
      </p>
    </div>
  )
}
