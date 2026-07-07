import type { Metadata } from 'next'
import ClaimaForm from './ClaimaForm'

export const metadata: Metadata = {
  title: 'Claima din BRF — Uppdatera föreningsinformation',
  description: 'Är du styrelseledamot? Claima er sida på BRFinfo och håll kontaktuppgifter uppdaterade.',
  alternates: { canonical: 'https://brfinfo.se/claima' },
}

export default function ClaimaPage() {
  return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px' }}>
      <span style={{ display: 'inline-block', background: 'rgba(27,124,110,0.1)', color: '#1B7C6E', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 20 }}>
        För BRF-styrelser
      </span>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.15 }}>
        Claima er <em style={{ color: '#1B7C6E', fontStyle: 'normal' }}>bostadsrättsförening</em>
      </h1>
      <p style={{ fontSize: 16, color: '#4A6070', lineHeight: 1.65, marginBottom: 32 }}>
        Lägg till kontaktuppgifter, uppdatera info och märk er förening som verifierad — kostnadsfritt.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
        {[
          { title: 'Verifieringsmärke', desc: 'Syns i sökresultat' },
          { title: 'Kontaktinfo', desc: 'Telefon och e-post' },
          { title: 'Korrekt data', desc: 'Rätta felaktig info' },
          { title: 'Gratis', desc: 'Grundprofil utan kostnad' },
        ].map(b => (
          <div key={b.title} style={{ background: '#F5F1E8', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10 }}>
            <span style={{ color: '#1B7C6E', fontWeight: 700, fontSize: 15 }}>✓</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0F1F2D' }}>{b.title}</div>
              <div style={{ fontSize: 12, color: '#6A8090', marginTop: 2 }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <ClaimaForm />
    </div>
  )
}
