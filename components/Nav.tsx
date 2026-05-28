'use client'
import Link from 'next/link'

export default function Nav() {
  return (
    <nav style={{ background: '#0F1F2D', position: 'sticky', top: 0, zIndex: 100, height: 60 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Links */}
        <div className="site-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {[
            { href: '/sok', label: 'Sök BRF', city: false },
            { href: '/stad/stockholm', label: 'Stockholm', city: true },
            { href: '/stad/goteborg', label: 'Göteborg', city: true },
            { href: '/stad/malmo', label: 'Malmö', city: true },
          ].map(l => (
            <Link key={l.href} href={l.href} className={l.city ? 'site-nav-city' : undefined} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>
              {l.label}
            </Link>
          ))}
          <Link href="/claima" style={{ background: '#C9932A', color: '#0F1F2D', padding: '7px 16px', borderRadius: 6, fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>
            Claima din BRF
          </Link>
        </div>
      </div>
    </nav>
  )
}
