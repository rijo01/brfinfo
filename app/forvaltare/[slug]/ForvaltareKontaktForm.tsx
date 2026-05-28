'use client'
import { useState } from 'react'

export default function ForvaltareKontaktForm({ forvaltareName }: { forvaltareName: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ namn: '', email: '', telefon: '', meddelande: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: '8cef0758-0330-4784-9b12-ada44eb712b6',
          subject: `Förvaltare-kontakt: ${forvaltareName}`,
          from_name: 'BRFinfo Förvaltare-formulär',
          forvaltare: forvaltareName,
          namn: form.namn,
          email: form.email,
          telefon: form.telefon,
          meddelande: form.meddelande,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Något gick fel')
      setSent(true)
    } catch { alert('Något gick fel, försök igen.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(15,31,45,0.15)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#1A2B38', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }

  if (sent) return (
    <div style={{ background: 'rgba(27,124,110,0.07)', border: '1px solid rgba(27,124,110,0.2)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#0F1F2D', marginBottom: 4 }}>Tack för ditt meddelande!</p>
      <p style={{ fontSize: 13, color: '#4A6070' }}>Vi återkommer inom 1–2 arbetsdagar.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { key: 'namn', label: 'Namn *', ph: 'Ditt namn', type: 'text', req: true },
          { key: 'email', label: 'E-post *', ph: 'namn@foretag.se', type: 'email', req: true },
          { key: 'telefon', label: 'Telefon', ph: '070-000 00 00', type: 'tel', req: false },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: 11, color: '#6A8090', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
            <input type={f.type} required={f.req} placeholder={f.ph} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inp} />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#6A8090', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Meddelande</label>
          <textarea placeholder="Berätta om ert intresse..." value={form.meddelande} onChange={e => setForm({ ...form, meddelande: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical' }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#6A8090' : '#1B7C6E', color: 'white', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Skickar...' : 'Skicka förfrågan'}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#8A9BAB', marginTop: 8, textAlign: 'center' }}>
        Priser: 490 kr/mån (bas), 990 kr/mån (partner), 2 490 kr/mån (premium)
      </p>
    </form>
  )
}
