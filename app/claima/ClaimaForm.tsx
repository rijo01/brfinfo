'use client'
import { useState } from 'react'

export default function ClaimaForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ brfNamn: '', orgnr: '', namn: '', roll: '', email: '', telefon: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: '8cef0758-0330-4784-9b12-ada44eb712b6',
          subject: `Claima-ansökan: ${form.brfNamn}`,
          from_name: 'BRFinfo Claima-formulär',
          brf: form.brfNamn,
          orgnr: form.orgnr,
          namn: form.namn,
          roll: form.roll,
          email: form.email,
          telefon: form.telefon,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Något gick fel')
      setSent(true)
    } catch { alert('Något gick fel, försök igen.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(15,31,45,0.15)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#1A2B38', fontFamily: 'inherit', outline: 'none', background: 'white' }

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
            { key: 'roll', label: 'Roll i styrelsen *', ph: 'T.ex. Ordförande', req: true },
            { key: 'email', label: 'E-post *', ph: 'styrelse@brf.se', req: true },
            { key: 'telefon', label: 'Telefon', ph: '070-000 00 00', req: false },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 12, color: '#6A8090', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
              <input type={f.key === 'email' ? 'email' : 'text'} required={f.req} placeholder={f.ph} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#6A8090' : '#1B7C6E', color: 'white', border: 'none', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Skickar...' : 'Skicka ansökan →'}
        </button>
        <p style={{ fontSize: 12, color: '#8A9BAB', marginTop: 10, textAlign: 'center' }}>Uppgifterna hanteras enligt GDPR.</p>
      </div>
    </form>
  )
}
