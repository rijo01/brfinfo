import { createClient } from '@supabase/supabase-js'
import { EnergiBadge } from '@/components/EnergiFakta'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, title: 'Energi-stats (admin)' }

type Props = { searchParams: Promise<{ key?: string }> }

// Enkel åtkomstkontroll: ?key=<ADMIN_STATS_KEY>. Sätt ADMIN_STATS_KEY i Vercel.
function authorized(provided: string | undefined): boolean {
  const expected = process.env.ADMIN_STATS_KEY
  if (!expected) return false
  return provided === expected
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !url.startsWith('http')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

const ORD = ['A0', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
const wrap: React.CSSProperties = { maxWidth: 900, margin: '0 auto', padding: '40px 24px' }
const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 400, color: '#0F1F2D', marginBottom: 16 }

export default async function EnergiStatsPage({ searchParams }: Props) {
  const { key } = await searchParams

  if (!authorized(key)) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={h2}>Åtkomst nekad</h1>
          <p style={{ fontSize: 14, color: '#6A8090' }}>Lägg till <code>?key=…</code> i adressen. Nyckeln sätts via miljövariabeln <code>ADMIN_STATS_KEY</code>.</p>
        </div>
      </div>
    )
  }

  const supabase = adminClient()
  if (!supabase) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={h2}>Inte konfigurerad</h1>
          <p style={{ fontSize: 14, color: '#6A8090' }}>Sätt <code>SUPABASE_SERVICE_ROLE_KEY</code> i miljön för att läsa statistiken.</p>
        </div>
      </div>
    )
  }

  // Hämta alla deklarationsrader (pilot är litet — ok att läsa allt).
  const { data: decls } = await supabase.from('energideklarationer').select('orgnr,energiklass,matchad,match_metod,kommun').limit(50000)
  const { data: leads } = await supabase.from('energi_leads').select('intresse,kommun,status,kalla,skapad_at').limit(50000)

  const d = decls ?? []
  const orgnrs = new Set(d.map(r => r.orgnr))
  const matchadeOrgnrs = new Set(d.filter(r => r.matchad).map(r => r.orgnr))
  const bearbetade = orgnrs.size
  const matchade = matchadeOrgnrs.size
  const matchRate = bearbetade ? (100 * matchade / bearbetade) : 0

  const byMetod: Record<string, { forsok: number; matchade: number }> = {}
  for (const r of d) {
    const m = r.match_metod || 'okänd'
    byMetod[m] = byMetod[m] || { forsok: 0, matchade: 0 }
    byMetod[m].forsok++
    if (r.matchad) byMetod[m].matchade++
  }

  const klassDist: Record<string, number> = {}
  for (const r of d) if (r.matchad && r.energiklass) klassDist[r.energiklass] = (klassDist[r.energiklass] || 0) + 1

  const l = leads ?? []
  const byIntresse: Record<string, number> = {}
  const byStad: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  for (const r of l) {
    if (r.intresse) byIntresse[r.intresse] = (byIntresse[r.intresse] || 0) + 1
    if (r.kommun) byStad[r.kommun] = (byStad[r.kommun] || 0) + 1
    byStatus[r.status || 'ny'] = (byStatus[r.status || 'ny'] || 0) + 1
  }

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ background: '#F5F1E8', borderRadius: 10, padding: '16px 18px', flex: '1 1 140px' }}>
      <div style={{ fontSize: 12, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#0F1F2D', fontFamily: 'Fraunces, Georgia, serif' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6A8090', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  const Bar = ({ label, n, max, color }: { label: React.ReactNode; n: number; max: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0', fontSize: 14 }}>
      <span style={{ width: 150, color: '#4A6070', display: 'flex', alignItems: 'center', gap: 8 }}>{label}</span>
      <span style={{ flex: 1, background: 'rgba(15,31,45,0.05)', borderRadius: 4, height: 18, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${max ? (100 * n / max) : 0}%`, background: color, borderRadius: 4, minWidth: n ? 2 : 0 }} />
      </span>
      <span style={{ width: 40, textAlign: 'right', fontWeight: 600, color: '#1A2B38' }}>{n}</span>
    </div>
  )

  const maxKlass = Math.max(1, ...Object.values(klassDist))
  const maxIntresse = Math.max(1, ...Object.values(byIntresse))

  return (
    <div style={wrap}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 300, color: '#0F1F2D', marginBottom: 6 }}>Energi-MVP — statistik</h1>
      <p style={{ fontSize: 13, color: '#8A9BAB', marginBottom: 24 }}>Match-rate och leads. Funnel-event (CTA-visning/-klick) läses i GA4 (stream G-0281GKZT7X).</p>

      <div style={card}>
        <h2 style={h2}>Matchning</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <Stat label="Bearbetade BRF" value={String(bearbetade)} />
          <Stat label="Matchade" value={String(matchade)} />
          <Stat label="Match-rate" value={`${matchRate.toFixed(1)}%`} sub="mål ≥ 60% (av API-försök)" />
        </div>
        <div style={{ fontSize: 12, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Per metod (matchade / försök)</div>
        {Object.entries(byMetod).map(([m, v]) => (
          <div key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(15,31,45,0.05)', fontSize: 14 }}>
            <span style={{ color: '#4A6070' }}>{m}</span>
            <span style={{ fontWeight: 500 }}>{v.matchade} / {v.forsok}{v.forsok ? ` (${(100 * v.matchade / v.forsok).toFixed(0)}%)` : ''}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2 style={h2}>Energiklass-fördelning</h2>
        {ORD.filter(k => klassDist[k]).length === 0 && <p style={{ fontSize: 14, color: '#8A9BAB' }}>Ingen matchad data ännu.</p>}
        {ORD.filter(k => klassDist[k]).map(k => (
          <Bar key={k} label={<><EnergiBadge klass={k} size="sm" /> {k}</>} n={klassDist[k]} max={maxKlass} color="#1B7C6E" />
        ))}
      </div>

      <div style={card}>
        <h2 style={h2}>Leads</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <Stat label="Totalt antal leads" value={String(l.length)} />
          <Stat label="Nya" value={String(byStatus['ny'] || 0)} />
          <Stat label="Kvalificerade" value={String(byStatus['kvalificerad'] || 0)} />
        </div>
        <div style={{ fontSize: 12, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Per intresse</div>
        {Object.keys(byIntresse).length === 0 && <p style={{ fontSize: 14, color: '#8A9BAB' }}>Inga leads ännu.</p>}
        {Object.entries(byIntresse).sort((a, b) => b[1] - a[1]).map(([i, n]) => (
          <Bar key={i} label={i} n={n} max={maxIntresse} color="#C9932A" />
        ))}
        {Object.keys(byStad).length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '14px 0 8px' }}>Per stad</div>
            {Object.entries(byStad).sort((a, b) => b[1] - a[1]).map(([s, n]) => (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                <span style={{ color: '#4A6070' }}>{s}</span><span style={{ fontWeight: 500 }}>{n}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
