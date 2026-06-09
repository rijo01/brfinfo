'use client'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

// Demosidan (/hemsida/demo) har egen footer och ska inte visa BRFinfos.
export default function SiteFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith('/hemsida/demo')) return null
  return <Footer />
}
