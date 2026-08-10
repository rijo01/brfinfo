'use client'
import { useEffect, useState } from 'react'

/**
 * Sant först när besökaren aktivt valt "Acceptera alla" i cookie-rutan.
 *
 * Delas av GoogleAnalytics, AdSenseScript och AdSlot. Logiken låg tidigare
 * duplicerad per komponent, vilket är just därför GA aldrig blev grindat när
 * AdSense blev det — en kopia uppdaterades, den andra glömdes bort. Med en
 * gemensam källa kan de inte glida isär igen.
 *
 * Startar alltid som false, så inget spårningsskript hamnar i SSR-HTML:en.
 * Lyssnar på 'cookie-consent-change' från CookieBanner så att ett klick slår
 * igenom direkt, utan omladdning.
 */
export function useCookieConsent(): boolean {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    const check = () => {
      try { setConsented(localStorage.getItem('cookie-consent') === 'all') } catch {}
    }
    check()
    window.addEventListener('cookie-consent-change', check)
    return () => window.removeEventListener('cookie-consent-change', check)
  }, [])

  return consented
}
