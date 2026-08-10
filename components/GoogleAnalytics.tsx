'use client'
import Script from 'next/script'
import { useCookieConsent } from '@/lib/useCookieConsent'

const GA_ID = 'G-0281GKZT7X'

// Laddas först efter "Acceptera alla", precis som AdSenseScript. /integritet
// utlovar att analyscookies inte laddas vid "Endast nödvändiga" — den här
// grinden är vad som gör det påståendet sant.
export function GoogleAnalytics() {
  const consented = useCookieConsent()

  if (!consented) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  )
}
