'use client'
import Script from 'next/script'
import { useCookieConsent } from '@/lib/useCookieConsent'

// Laddar Google AdSense först efter att besökaren accepterat alla cookies.
export default function AdSenseScript() {
  const consented = useCookieConsent()

  if (!consented) return null

  return (
    <Script
      id="adsbygoogle-script"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4694490733358572"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
