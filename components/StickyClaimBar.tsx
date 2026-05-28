'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'claimbar-dismissed'

export default function StickyClaimBar({ brfNamn }: { brfNamn: string }) {
  // Start hidden to avoid SSR/hydration mismatch; reveal after mount unless dismissed.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let dismissed = false
    try { dismissed = sessionStorage.getItem(STORAGE_KEY) === '1' } catch {}
    if (!dismissed) setVisible(true)
  }, [])

  // Give the main content room so nothing is hidden behind the fixed bar.
  useEffect(() => {
    if (!visible) return
    const main = document.querySelector('main')
    if (!main) return
    const prev = main.style.paddingBottom
    main.style.paddingBottom = '80px'
    return () => { main.style.paddingBottom = prev }
  }, [visible])

  if (!visible) return null

  function dismiss() {
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch {}
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label="Claima denna förening"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: '#0F1F2D',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
          <span className="claimbar-full">Är du i styrelsen för {brfNamn}?</span>
          <span className="claimbar-short">Styrelsemedlem?</span>
        </p>

        <Link
          href="/claima"
          style={{
            flexShrink: 0,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            background: 'rgba(201,147,42,0.14)',
            border: '1px solid rgba(201,147,42,0.55)',
            color: '#C9932A',
            padding: '9px 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '0.2px',
          }}
        >
          <span className="claimbar-full">Claima sidan gratis →</span>
          <span className="claimbar-short">Claima gratis →</span>
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Stäng"
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 22,
            lineHeight: 1,
            cursor: 'pointer',
            borderRadius: 6,
            fontFamily: 'inherit',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
