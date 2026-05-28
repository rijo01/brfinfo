'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CookieBanner() {
  // Start hidden to avoid SSR/hydration mismatch; reveal after mount if no choice yet.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let consent: string | null = null
    try { consent = localStorage.getItem('cookie-consent') } catch {}
    if (consent !== 'all' && consent !== 'necessary') setVisible(true)
  }, [])

  function choose(value: 'all' | 'necessary') {
    try { localStorage.setItem('cookie-consent', value) } catch {}
    // Notify AdSense loader (and any other listeners) in the same session.
    window.dispatchEvent(new Event('cookie-consent-change'))
    setVisible(false)
  }

  if (!visible) return null

  const btnBase: React.CSSProperties = {
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie-samtycke"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 400,
        background: '#0F1F2D',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -6px 24px rgba(0,0,0,0.28)',
      }}
    >
      <div className="cookie-banner-row" style={{ maxWidth: 1100, margin: '0 auto', padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <p style={{ flex: '1 1 280px', minWidth: 0, margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
          Vi använder cookies för att förbättra din upplevelse och visa relevanta annonser. Läs vår{' '}
          <Link href="/integritet" style={{ color: '#C9932A', textDecoration: 'underline' }}>integritetspolicy</Link>.
        </p>
        <div className="cookie-banner-actions" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => choose('necessary')}
            style={{ ...btnBase, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.85)' }}
          >
            Endast nödvändiga
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            style={{ ...btnBase, background: '#C9932A', color: '#0F1F2D' }}
          >
            Acceptera alla
          </button>
        </div>
      </div>
    </div>
  )
}
