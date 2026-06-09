import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Demo: Brf Solbacken — exempel på föreningshemsida',
  description: 'Exempelsida som visar hur en hemsida från BRFinfo kan se ut för en bostadsrättsförening.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://brfinfo.se/hemsida' },
}

// Egen palett — medvetet skild från BRFinfos brand (navy/guld/serif).
const C = {
  ink: '#1E2A23',
  brand: '#2F6B57',
  brandDark: '#234E40',
  accent: '#C46A3D',
  cream: '#FBF8F2',
  paper: '#FFFFFF',
  line: 'rgba(30,42,35,0.10)',
  muted: '#5C6B62',
}
const SANS = "'DM Sans', system-ui, -apple-system, sans-serif"

const NAVLINKS = ['Hem', 'Föreningen', 'Dokument', 'Felanmälan', 'Kontakt']

export default function HemsidaDemoPage() {
  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: SANS, minHeight: '100vh' }}>
      {/* Demo-banner (länkar tillbaka till säljsidan) */}
      <div style={{ background: C.ink, color: 'white', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontFamily: SANS }}>
        Detta är en demosida.{' '}
        <Link href="/hemsida" style={{ color: '#E8B84B', textDecoration: 'underline', fontWeight: 600 }}>
          Vill din förening ha en egen? →
        </Link>
      </div>

      {/* Föreningens egen nav */}
      <header style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: C.brand, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>S</div>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Brf Solbacken</span>
          </div>
          <nav style={{ display: 'flex', gap: 22 }}>
            {NAVLINKS.map((l, i) => (
              <span key={l} style={{ fontSize: 14, color: i === 0 ? C.brand : C.muted, fontWeight: i === 0 ? 600 : 400, cursor: 'default' }}>{l}</span>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(150deg, ${C.brandDark} 0%, ${C.brand} 100%)`, color: 'white', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '5px 13px', borderRadius: 20, fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 18 }}>
              Välkommen
            </div>
            <h1 style={{ fontSize: 'clamp(30px,5vw,46px)', fontWeight: 700, lineHeight: 1.12, letterSpacing: '-1px', marginBottom: 16 }}>
              Bostadsrättsföreningen Solbacken
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 28 }}>
              En trivsam förening med 48 lägenheter i centrala Solstaden. Här hittar du information för boende, dokument och kontakt till styrelsen.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ background: C.accent, color: 'white', padding: '12px 22px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'default' }}>Gör en felanmälan</span>
              <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '12px 22px', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'default' }}>Kontakta styrelsen</span>
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 24 }}>Aktuellt</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
          {[
            { tag: 'Stämma', date: '12 maj', title: 'Kallelse till ordinarie föreningsstämma', body: 'Årets stämma hålls den 28 maj kl 18:30 i föreningslokalen. Handlingar finns under Dokument.' },
            { tag: 'Drift', date: '4 maj', title: 'Spolning av avlopp vecka 21', body: 'Underhållsspolning av stammar genomförs i hela huset. Mer information kommer i trappuppgångarna.' },
            { tag: 'Trivsel', date: '20 apr', title: 'Vårstädning på gården', body: 'Vi träffas lördag den 4 maj kl 10. Föreningen bjuder på fika. Alla är välkomna att hjälpa till!' },
          ].map(n => (
            <article key={n.title} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '22px 24px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ background: 'rgba(47,107,87,0.12)', color: C.brand, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{n.tag}</span>
                <span style={{ fontSize: 12.5, color: C.muted }}>{n.date}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.25 }}>{n.title}</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{n.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Board + quick links */}
      <section style={{ background: C.paper, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'start' }} className="demo-board-grid">
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 18 }}>Styrelsen</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14 }}>
              {[
                { name: 'Anna Lind', role: 'Ordförande' },
                { name: 'Johan Berg', role: 'Kassör' },
                { name: 'Sara Holm', role: 'Sekreterare' },
                { name: 'Erik Falk', role: 'Ledamot' },
              ].map(p => (
                <div key={p.name} style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.brand, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{p.name[0]}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{p.role}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 18 }}>Dokument</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Stadgar', 'Årsredovisning 2024', 'Senaste stämmoprotokoll', 'Trivselregler', 'Andrahandsuthyrning'].map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.cream, border: `1px solid ${C.line}`, borderRadius: 8, padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'default' }}>
                  <span>{d}</span>
                  <span style={{ color: C.accent, fontSize: 13 }}>PDF ↓</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Föreningens egen footer */}
      <footer style={{ background: C.ink, color: 'rgba(255,255,255,0.7)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 28 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10 }}>Brf Solbacken</div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>Solbacksvägen 12, 123 45 Solstaden<br />styrelsen@brfsolbacken.se</p>
            </div>
            <div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Genvägar</div>
              {NAVLINKS.map(l => (
                <div key={l} style={{ fontSize: 13.5, marginBottom: 7, cursor: 'default' }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>© Brf Solbacken</span>
            <span>
              Hemsida av{' '}
              <Link href="/hemsida" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>BRFinfo</Link>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
