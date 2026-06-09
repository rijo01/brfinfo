'use client'
import { useState } from 'react'

export default function HemsidaLeadForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({
    forening: '',
    namn: '',
    email: '',
    telefon: '',
    meddelande: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const formData = new FormData()
      formData.append('access_key', '8007467a-7cc3-47b6-828a-72a6c603e5fb')
      formData.append('subject', `Ny hemsida-förfrågan: ${form.forening}`)
      formData.append('from_name', 'BRFinfo Hemsida-formulär')
      formData.append('forening', form.forening)
      formData.append('namn', form.namn)
      formData.append('email', form.email)
      formData.append('telefon', form.telefon)
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

  const inp: React.CSSProperties = {
    width: '100%',
    border: '1px solid rgba(15,31,45,0.15)',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: '#1A2B38',
    fontFamily: 'inherit',
    outline: 'none',
    background: 'white',
    boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    color: '#6A8090',
    marginBottom: 5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  if (sent) {
    return (
      <div style={{ background: 'rgba(27,124,110,0.07)', border: '1px solid rgba(27,124,110,0.25)', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1B7C6E', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 14px' }}>
          ✓
        </div>
        <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 6 }}>
          Tack — vi har tagit emot din förfrågan
        </h3>
        <p style={{ fontSize: 14, color: '#4A6070', lineHeight: 1.6 }}>
          Vi hör av oss med ett förslag inom 1–2 arbetsdagar.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>Förening *</label>
        <input required type="text" placeholder="Brf Storken" value={form.forening} onChange={e => setForm({ ...form, forening: e.target.value })} style={inp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={lbl}>Ditt namn *</label>
          <input required type="text" placeholder="För- och efternamn" value={form.namn} onChange={e => setForm({ ...form, namn: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={lbl}>Telefon</label>
          <input type="tel" placeholder="070-000 00 00" value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} style={inp} />
        </div>
      </div>

      <div>
        <label style={lbl}>E-post *</label>
        <input required type="email" placeholder="namn@forening.se" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
      </div>

      <div>
        <label style={lbl}>Meddelande</label>
        <textarea rows={4} placeholder="Har ni en sida idag? Vad är viktigast för er förening?" value={form.meddelande} onChange={e => setForm({ ...form, meddelande: e.target.value })} style={{ ...inp, resize: 'vertical', minHeight: 96 }} />
      </div>

      {err && (
        <div style={{ background: 'rgba(200,60,60,0.08)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A03030' }}>
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#6A8090' : '#0F1F2D',
          color: '#E8B84B',
          border: 'none',
          padding: '14px 20px',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          marginTop: 4,
          letterSpacing: '0.2px',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Skickar…' : 'Boka kostnadsfri genomgång →'}
      </button>

      <p style={{ fontSize: 12, color: '#8A9BAB', textAlign: 'center', marginTop: 2 }}>
        Inga förpliktelser. Vi återkommer inom 1–2 arbetsdagar.
      </p>
    </form>
  )
}
