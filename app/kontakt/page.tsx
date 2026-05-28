import type { Metadata } from 'next'
import KontaktForm from './KontaktForm'

export const metadata: Metadata = {
  title: 'Kontakta oss',
  description: 'Har du frågor om BRFinfo eller vill du annonsera? Kontakta oss på info@brfinfo.se eller via formuläret.',
  alternates: { canonical: 'https://brfinfo.se/kontakt' },
}

export default function KontaktPage() {
  return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px' }}>
      <span style={{ display: 'inline-block', background: 'rgba(27,124,110,0.1)', color: '#1B7C6E', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 20 }}>
        Kontakt
      </span>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.15 }}>
        Kontakta oss
      </h1>
      <p style={{ fontSize: 16, color: '#4A6070', lineHeight: 1.65, marginBottom: 12 }}>
        Har du frågor om BRFinfo eller vill du annonsera? Hör av dig!
      </p>
      <p style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.65, marginBottom: 32 }}>
        Du når oss direkt på{' '}
        <a href="mailto:info@brfinfo.se" style={{ color: '#1B7C6E', fontWeight: 500, textDecoration: 'none' }}>
          info@brfinfo.se
        </a>{' '}
        eller genom att fylla i formuläret nedan.
      </p>

      <KontaktForm />
    </div>
  )
}
