import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#0F1F2D', padding: '48px 24px 32px', marginTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: 'white', marginBottom: 12 }}>
              BRF<span style={{ color: '#1B7C6E' }}>info</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 260 }}>
              Sveriges mest kompletta BRF-register. Data från Bolagsverket och SCB, uppdateras dagligen.
            </p>
          </div>
          {[
            { title: 'Hitta BRF', links: [{ href: '/sok', label: 'Sök BRF' }, { href: '/stad/stockholm', label: 'Stockholm' }, { href: '/stad/goteborg', label: 'Göteborg' }, { href: '/stad/malmo', label: 'Malmö' }] },
            { title: 'För företag', links: [{ href: '/claima', label: 'Claima BRF' }, { href: '/forvaltare', label: 'Förvaltarpartner' }, { href: '/premium', label: 'BRF Premium' }] },
            { title: 'Om oss', links: [{ href: '/om', label: 'Om BRFinfo' }, { href: '/integritet', label: 'Integritetspolicy' }, { href: '/kontakt', label: 'Kontakt' }] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {col.links.map(l => (
                  <li key={l.href} style={{ marginBottom: 8 }}>
                    <Link href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} BRFinfo.se</span>
          <span>Data från Bolagsverket och SCB</span>
        </div>
      </div>
    </footer>
  )
}
