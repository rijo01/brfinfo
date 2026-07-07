'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/sok', label: 'Sök BRF', city: false },
  { href: '/styrelseguide', label: 'Styrelseguide', city: false },
  { href: '/hemsida', label: 'Hemsida åt BRF', city: false },
  { href: '/stad/stockholm', label: 'Stockholm', city: true },
  { href: '/stad/goteborg', label: 'Göteborg', city: true },
  { href: '/stad/malmo', label: 'Malmö', city: true },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Demosidan har egen nav/footer och ska inte visa BRFinfos brand.
  if (pathname?.startsWith('/hemsida/demo')) return null

  const close = () => setOpen(false)

  return (
    <nav style={{ background: '#0F1F2D', position: 'sticky', top: 0, zIndex: 100, height: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" onClick={close} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#0F1F2D"/>
            <path d="M16 4L4 14H7V27H13V21H19V27H25V14H28L16 4Z" fill="#C9932A"/>
            <rect x="13" y="21" width="6" height="6" fill="#0F1F2D"/>
            <circle cx="11" cy="19" r="1.8" fill="#0F1F2D"/>
            <circle cx="21" cy="19" r="1.8" fill="#0F1F2D"/>
          </svg>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: 'white', letterSpacing: '-0.3px' }}>
            BRF<span style={{ color: '#1B7C6E' }}>info</span>
          </span>
        </Link>

        {/* Hamburger — visas bara på små skärmar (via CSS) */}
        <button
          type="button"
          className="site-nav-toggle"
          aria-label={open ? 'Stäng meny' : 'Öppna meny'}
          aria-expanded={open}
          aria-controls="site-nav-menu"
          onClick={() => setOpen(v => !v)}
          style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, margin: 0, color: 'white', lineHeight: 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>

        {/* Links — flex-rad på desktop, hopfällbar dropdown på mobil (via CSS) */}
        <div id="site-nav-menu" className="site-nav-links" data-open={open ? 'true' : 'false'} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={close} className={l.city ? 'site-nav-city' : undefined} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>
              {l.label}
            </Link>
          ))}
          <Link href="/claima" onClick={close} className="site-nav-cta" style={{ background: '#C9932A', color: '#0F1F2D', padding: '7px 16px', borderRadius: 6, fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>
            Claima din BRF
          </Link>
        </div>
      </div>
    </nav>
  )
}
