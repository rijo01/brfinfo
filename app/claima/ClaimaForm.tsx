'use client'
import { useState } from 'react'

// Roller måste matcha ROLLER i app/api/claim/route.ts — routen avvisar allt annat.
const ROLLER = ['Ordförande', 'Kassör', 'Sekreterare', 'Ledamot', 'Suppleant', 'Annan']

export default function ClaimaForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ brfNamn: '', orgnr: '', namn: '', roll: '', email: '', telefon: '', meddelande: '' })
  // Honeypot. Dolt för människor, ifyllt av bottar. Se routen.
  const [company, setCompany] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Tidigare gick det här till Web3Forms och landade bara i en inkorg —
      // ansökningarna sparades ingenstans, så claim_status kunde aldrig mätas.
      // Nu: egen server-route → brf_claims + brf_utskick.claim_status.
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brf_namn: form.brfNamn,
          orgnr: form.orgnr,
          namn: form.namn,
          roll: form.roll,
          email: form.email,
          telefon: form.telefon,
          meddelande: form.meddelande,
          company,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Något gick fel. Försök igen.')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(15,31,45,0.15)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#1A2B38', fontFamily: 'inherit', outline: 'none', background: 'white' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, color: '#6A8090', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (sent) return (
    <div style={{ background: 'rgba(27,124,110,0.07)', border: '1px solid rgba(27,124,110,0.2)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, color: '#0F1F2D', marginBottom: 8 }}>Ansökan mottagen!</h2>
      <p style={{ fontSize: 14, color: '#4A6070' }}>Vi återkommer inom 1–2 arbetsdagar via e-post.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {[
            { key: 'brfNamn', label: 'BRF-namn *', ph: 'T.ex. Brf Hornsgatan 42', req: true },
            { key: 'orgnr', label: 'Org.nr *', ph: '769600-XXXX', req: true },
            { key: 'namn', label: 'Ditt namn *', ph: 'Förnamn Efternamn', req: true },
          ].map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input type="text" required={f.req} placeholder={f.ph} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
            </div>
          ))}
          <div>
            <label style={lbl}>Roll i styrelsen *</label>
            <select required value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })} style={inp}>
              <option value="">Välj roll…</option>
              {ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>E-post *</label>
            <input type="email" required placeholder="styrelse@brf.se" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>Telefon</label>
            <input type="tel" placeholder="070-000 00 00" value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Meddelande</label>
          <textarea rows={3} placeholder="Valfritt — t.ex. hur vi kan nå er för verifiering" value={form.meddelande} onChange={e => setForm({ ...form, meddelande: e.target.value })} style={{ ...inp, resize: 'vertical' }} />
        </div>

        {/* Honeypot: dold för människor, oemotståndlig för bottar. */}
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <label htmlFor="company">Företag</label>
          <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={e => setCompany(e.target.value)} />
        </div>

        {error && (
          <div role="alert" style={{ background: 'rgba(190,60,50,0.07)', border: '1px solid rgba(190,60,50,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#8E2B22' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#6A8090' : '#1B7C6E', color: 'white', border: 'none', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Skickar...' : 'Skicka ansökan →'}
        </button>
        <p style={{ fontSize: 12, color: '#8A9BAB', marginTop: 10, textAlign: 'center' }}>Uppgifterna hanteras enligt GDPR. Se <a href="/integritet" style={{ color: '#1B7C6E' }}>integritetspolicyn</a>.</p>
      </div>
    </form>
  )
}
