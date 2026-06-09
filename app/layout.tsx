import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import SiteFooter from '@/components/SiteFooter'
import ScrollToTop from '@/components/ScrollToTop'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import CookieBanner from '@/components/CookieBanner'
import AdSenseScript from '@/components/AdSenseScript'

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
      </head>
      <body>
        <GoogleAnalytics />
        <AdSenseScript />
        <Nav />
        <ScrollToTop />
        <main>{children}</main>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  )
}
