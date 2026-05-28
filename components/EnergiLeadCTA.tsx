'use client'
import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/gtag'

type Props = {
  brfNamn: string
  orgnr: string
  kommun: string | null
  energiklass?: string | null
  kalla?: string
}

const INTRESSEN = [
  { value: 'energikartlaggning', label: 'Energikartläggning' },
  { value: 'solceller', label: 'Solceller' },
  { value: 'varmepump', label: 'Värmepump' },
  { value: 'fonster', label: 'Fönsterbyte' },
  { value: 'annat', label: 'Annat' },
]

const inp: React.CSSProperties = { width: '100%', border: '1px solid rgba(15,31,45,0.15)', borderRadius: 8, padding: '11px 14px', fontSize: 14, color: '#1A2B38', fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: '#6A8090', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }

export default function EnergiLeadCTA({ brfNamn, orgnr, kommun, energiklass, kalla = 'brf-sida' }: Props) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [form, setForm] = useState({ intresse: 'energikartlaggning', email: '', telefon: '', meddelande: '', company: '' })
  const ref = useRef<HTMLDivElement>(null)
  const viewed = useRef(false)

  // GA4: CTA-visning (en gång, när sektionen syns).
  useEffect(() => {
    const el = ref.current
    if (!el || viewed.current) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !viewed.current) {
          viewed.current = true
          track('energi_cta_view', { orgnr, kommun: kommun ?? '', energiklass: energiklass ?? '' })
          io.disconnect()
        }
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [orgnr, kommun, energiklass])

  function openForm() {
    setOpen(true)
    track('energi_cta_click', { orgnr, kommun: kommun ?? '', energiklass: energiklass ?? '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/energi-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgnr, brf_namn: brfNamn, kommun,
          intresse: form.intresse,
          kontakt_email: form.email,
          kontakt_telefon: form.telefon,
          meddelande: form.meddelande,
          company: form.company,
          kalla,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Något gick fel')
      track('energi_lead_submit', { orgnr, kommun: kommun ?? '', intresse: form.intresse })
      setSent(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Kunde inte skicka. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', borderRadius: 12, padding: '24px 28px', marginBottom: 16, color: 'white' }}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 400, marginBottom: 6 }}>Tack — vi hör av oss!</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Vi återkommer till {form.email} med nästa steg.</p>
        </div>
      ) : !open ? (
        <div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 400, marginBottom: 8, letterSpacing: '-0.3px' }}>
            Få offert på energiåtgärder för föreningen
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16, maxWidth: 480 }}>
            Vill styrelsen sänka energikostnaderna? Få kostnadsfria offerter på energikartläggning, solceller, värmepump eller fönsterbyte — anpassat efter {brfNamn}.
          </p>
          <button onClick={openForm} style={{ background: '#C9932A', color: '#0F1F2D', border: 'none', padding: '12px 22px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Få offert på energiåtgärder →
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 400, marginBottom: 4 }}>Få offert för {brfNamn}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>Kostnadsfritt och utan förbindelse.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
            <div>
              <label style={{ ...lbl, color: 'rgba(255,255,255,0.6)' }}>Intresseområde</label>
              <select value={form.intresse} onChange={e => setForm({ ...form, intresse: e.target.value })} style={inp}>
                {INTRESSEN.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...lbl, color: 'rgba(255,255,255,0.6)' }}>E-post *</label>
              <input required type="email" placeholder="styrelse@exempel.se" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={{ ...lbl, color: 'rgba(255,255,255,0.6)' }}>Telefon</label>
              <input type="tel" placeholder="Valfritt" value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={{ ...lbl, color: 'rgba(255,255,255,0.6)' }}>Meddelande</label>
              <textarea rows={3} placeholder="Berätta kort om föreningens behov (valfritt)" value={form.meddelande} onChange={e => setForm({ ...form, meddelande: e.target.value })} style={{ ...inp, resize: 'vertical', minHeight: 70 }} />
            </div>
            {/* Honeypot */}
            <input type="text" name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden />

            {err && <div style={{ background: 'rgba(255,120,120,0.12)', border: '1px solid rgba(255,120,120,0.3)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#FFD0D0' }}>{err}</div>}

            <button type="submit" disabled={loading} style={{ background: loading ? '#6A8090' : '#C9932A', color: '#0F1F2D', border: 'none', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Skickar...' : 'Skicka förfrågan →'}
            </button>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Uppgifterna hanteras enligt GDPR och delas endast med relevant leverantör.</p>
          </div>
        </form>
      )}
    </div>
  )
}
