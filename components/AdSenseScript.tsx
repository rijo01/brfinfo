'use client'
import Script from 'next/script'
import { useEffect, useState } from 'react'

// Loads Google AdSense only after the user has accepted all cookies.
// Listens for 'cookie-consent-change' so accepting in the banner loads it
// without a full page reload.
export default function AdSenseScript() {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    const check = () => {
      try { setConsented(localStorage.getItem('cookie-consent') === 'all') } catch {}
    }
    check()
    window.addEventListener('cookie-consent-change', check)
    return () => window.removeEventListener('cookie-consent-change', check)
  }, [])

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
