'use client'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/lib/useCookieConsent'

const CLIENT = 'ca-pub-4694490733358572'
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BRF

// Fast höjd i stället för data-ad-format="auto": ett auto-format väljer höjd först
// när annonsen laddats, vilket är precis det som ger layouthopp. Bredden är
// responsiv (100 %), höjden låst — ytan har sin slutliga storlek redan i HTML:en,
// så CLS-bidraget är 0. 280 px rymmer de vanliga formaten (300x250, 336x280).
const SLOT_HEIGHT = 280
const LABEL_HEIGHT = 18

// Google AdSense pushar annonser via en global kö.
declare global {
  interface Window { adsbygoogle?: unknown[] }
}

/**
 * En responsiv display-enhet med reserverad höjd.
 *
 * Renderas alltid (även utan samtycke) så att ytan är lika stor vid varje
 * rendering — annars skulle rutan växa fram efter "Acceptera alla" och flytta
 * innehållet under sig. Själva annonsbegäran görs först vid samtycke, i linje
 * med AdSenseScript som inte ens laddar adsbygoogle.js dessförinnan.
 */
export default function AdSlot() {
  const consented = useCookieConsent()
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!consented || !SLOT || pushed.current) return
    const el = insRef.current
    // AdSense kastar "adsbygoogle.push() error: All ins elements ... already
    // have ads in them" om samma <ins> pushas två gånger — vilket React
    // StrictMode gör i dev genom att köra effekter dubbelt.
    if (!el || el.getAttribute('data-adsbygoogle-status')) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {}
  }, [consented])

  // Utan enhets-ID från AdSense-panelen finns inget att serva, och då vore den
  // reserverade ytan bara tom luft.
  if (!SLOT) return null

  return (
    <div
      aria-label="Annons"
      style={{
        height: SLOT_HEIGHT + LABEL_HEIGHT,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: LABEL_HEIGHT,
          fontSize: 10,
          lineHeight: `${LABEL_HEIGHT}px`,
          color: '#8A9BAB',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        Annons
      </div>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: SLOT_HEIGHT }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
      />
    </div>
  )
}
