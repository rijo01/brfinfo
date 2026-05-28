'use client'
import { useState } from 'react'

export default function KontaktForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({ namn: '', email: '', amne: '', meddelande: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const formData = new FormData()
      formData.append('access_key', '8cef0758-0330-4784-9b12-ada44eb712b6')
      formData.append('subject', form.amne ? `Kontakt: ${form.amne}` : 'Kontakt via brfinfo.se')
      formData.append('from_name', 'BRFinfo Kontaktformulär')
      formData.append('namn', form.namn)
      formData.append('email', form.email)
      formData.append('amne', form.amne)
      formData.append('meddelande', form.meddelande)
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!data.success) throw new Error(data.message || 'Något gick fel')
      setSent(true)
    } catch {
      setErr('Kunde inte skicka. Försök igen eller mejla info@brfinfo.se')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(15,31,45,0.15)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#1A2B38', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: '#6A8090', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (sent) return (
    <div style={{ background: 'rgba(27,124,110,0.07)', border: '1px solid rgba(27,124,110,0.2)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, color: '#0F1F2D', marginBottom: 8 }}>Tack för ditt meddelande!</h2>
      <p style={{ fontSize: 14, color: '#4A6070' }}>Vi återkommer så snart vi kan, vanligtvis inom 1–2 arbetsdagar.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lbl}>Namn *</label>
          <input required type="text" placeholder="För- och efternamn" value={form.namn} onChange={e => setForm({ ...form, namn: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={lbl}>E-post *</label>
          <input required type="email" placeholder="namn@exempel.se" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={lbl}>Ämne *</label>
          <input required type="text" placeholder="Vad gäller det?" value={form.amne} onChange={e => setForm({ ...form, amne: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={lbl}>Meddelande *</label>
          <textarea required rows={5} placeholder="Skriv ditt meddelande här..." value={form.meddelande} onChange={e => setForm({ ...form, meddelande: e.target.value })} style={{ ...inp, resize: 'vertical', minHeight: 110 }} />
        </div>

        {err && (
          <div style={{ background: 'rgba(200,60,60,0.08)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A03030' }}>
            {err}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#6A8090' : '#1B7C6E', color: 'white', border: 'none', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Skickar...' : 'Skicka meddelande →'}
        </button>
        <p style={{ fontSize: 12, color: '#8A9BAB', textAlign: 'center' }}>Uppgifterna hanteras enligt GDPR.</p>
      </div>
    </form>
  )
}
