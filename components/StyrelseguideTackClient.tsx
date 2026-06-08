'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const NAVY = '#0F1F2D'
const TEAL = '#1B7C6E'
const GOLD = '#C9932A'

type VerifyResult = { paid: boolean; tier?: string; namn?: string }
type Status = 'loading' | 'paid' | 'unpaid' | 'error'

export default function StyrelseguideTackClient() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<Status>('loading')
  const [result, setResult] = useState<VerifyResult | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('unpaid')
      return
    }
    let active = true
    fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(res => res.json())
      .then((data: VerifyResult) => {
        if (!active) return
        if (data.paid) {
          setResult(data)
          setStatus('paid')
        } else {
          setStatus('unpaid')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [sessionId])

  if (status === 'loading') {
    return <p style={{ color: '#4A6070', fontSize: 15 }}>Verifierar din betalning…</p>
  }

  if (status === 'paid' && result) {
    return (
      <div>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(27,124,110,0.12)', color: TEAL, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          ✓
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(26px,4vw,34px)', fontWeight: 400, color: NAVY, letterSpacing: '-0.5px', marginBottom: 12 }}>
          Tack för ditt köp!
        </h1>
        <p style={{ fontSize: 16, color: '#4A6070', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 12px' }}>
          {result.namn ? `${result.namn} är klar att ladda ner.` : 'Din guide är klar att ladda ner.'} Spara filen — nedladdningslänken är personlig för det här köpet och slutar fungera om en timme.
        </p>
        <a
          href={`/api/download?session_id=${encodeURIComponent(sessionId ?? '')}`}
          style={{ display: 'inline-block', background: GOLD, color: NAVY, padding: '14px 30px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', marginTop: 16 }}
        >
          ⬇ Ladda ner guiden (PDF)
        </a>
        <p style={{ fontSize: 13, color: '#6A8090', marginTop: 28 }}>
          Problem med nedladdningen?{' '}
          <Link href="/kontakt" style={{ color: TEAL, textDecoration: 'underline' }}>Kontakta oss</Link> så hjälper vi dig.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(24px,4vw,30px)', fontWeight: 400, color: NAVY, marginBottom: 12 }}>
          Något gick fel
        </h1>
        <p style={{ fontSize: 16, color: '#4A6070', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
          Vi kunde inte verifiera din betalning just nu. Har pengarna dragits men du inte fått din guide?{' '}
          <Link href="/kontakt" style={{ color: TEAL, textDecoration: 'underline' }}>Kontakta oss</Link> så löser vi det direkt.
        </p>
        <Link href="/styrelseguide" style={{ color: TEAL, textDecoration: 'underline', fontSize: 14 }}>
          Tillbaka till guiden
        </Link>
      </div>
    )
  }

  // unpaid / saknar session_id
  return (
    <div>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(24px,4vw,30px)', fontWeight: 400, color: NAVY, marginBottom: 12 }}>
        Betalningen kunde inte bekräftas
      </h1>
      <p style={{ fontSize: 16, color: '#4A6070', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
        Vi kunde inte hitta en genomförd betalning för den här guiden. Om du avbröt köpet kan du försöka igen.
      </p>
      <Link href="/styrelseguide" style={{ display: 'inline-block', background: NAVY, color: 'white', padding: '12px 26px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        Till guiden
      </Link>
    </div>
  )
}
