import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  metadataBase: new URL('https://brfinfo.se'),
  title: { default: 'BRFinfo.se — Sveriges BRF-register', template: '%s | BRFinfo.se' },
  description: 'Hitta styrelseinfo, avgifter och kontakt för alla 26 795 BRF:er i Sverige. Data från Bolagsverket.',
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
  other: {
    'google-adsense-account': 'ca-pub-4694490733358572',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4694490733358572"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <GoogleAnalytics />
        <Nav />
        <ScrollToTop />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
