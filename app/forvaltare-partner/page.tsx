import type { Metadata } from 'next'
import Link from 'next/link'
import PartnerForm from './PartnerForm'

export const metadata: Metadata = {
  title: 'Partnerprogram för förvaltare — under utveckling',
  description:
    'Vi bygger ett partnerprogram för förvaltare på Sveriges BRF-register med över 29 000 föreningar. Lämna en intresseanmälan så hör vi av oss vid lansering.',
  alternates: { canonical: 'https://brfinfo.se/forvaltare-partner' },
  openGraph: {
    title: 'Partnerprogram för förvaltare — under utveckling',
    description:
      'Vi bygger ett partnerprogram för förvaltare på Sveriges BRF-register. Lämna en intresseanmälan så formar era behov vad vi bygger.',
    url: 'https://brfinfo.se/forvaltare-partner',
    type: 'website',
  },
}

const colors = {
  ink: '#0F1F2D',
  inkLight: '#1A3045',
  teal: '#1B7C6E',
  gold: '#C9932A',
  goldLight: '#E8B84B',
  cream: '#F5F1E8',
  muted: '#6A8090',
  border: 'rgba(15,31,45,0.09)',
}

export default async function ForvaltarePartnerPage() {
  // Samma skäl som på startsidan: getBRFCount() tog 28,2 s och timeoutade.
  const brfCountLabel = 'över 29 000'
  return (
    <>
      {/* HERO */}
      <section
        style={{
          background: `linear-gradient(160deg, ${colors.ink} 0%, ${colors.inkLight} 100%)`,
          padding: '88px 24px 96px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(201,147,42,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(201,147,42,0.05) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />
        <div aria-hidden style={{ position: 'absolute', top: -120, right: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,147,42,0.18), transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -140, left: -140, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,124,110,0.22), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(201,147,42,0.12)',
              border: '1px solid rgba(201,147,42,0.3)',
              padding: '6px 16px',
              borderRadius: 24,
              fontSize: 12,
              color: colors.goldLight,
              fontWeight: 600,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            <span style={{ width: 6, height: 6, background: colors.goldLight, borderRadius: '50%' }} />
            Under utveckling
          </div>

          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 'clamp(36px, 6vw, 60px)',
              fontWeight: 300,
              color: 'white',
              lineHeight: 1.08,
              letterSpacing: '-1.5px',
              marginBottom: 24,
            }}
          >
            Vi bygger ett{' '}
            <em style={{ color: colors.goldLight, fontStyle: 'normal' }}>partnerprogram</em>{' '}
            för förvaltare
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 18,
              lineHeight: 1.65,
              maxWidth: 600,
              margin: '0 auto 44px',
            }}
          >
            BRFinfo.se är ett oberoende register över Sveriges bostadsrättsföreningar. Vi
            utvecklar just nu ett program för förvaltningsbolag som vill synas här. Det är inte
            lanserat ännu — men era behov är med och formar vad vi bygger.
          </p>

          {/* KPI Strip — sanna siffror */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 1,
              maxWidth: 720,
              margin: '0 auto',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {[
              { num: brfCountLabel, label: 'Föreningar i registret' },
              { num: '290', label: 'Kommuner' },
              { num: 'Bolagsverket & SCB', label: 'Datakällor' },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: colors.ink,
                  padding: '20px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 22,
                    fontWeight: 500,
                    color: colors.goldLight,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginTop: 6,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTRESSEANMÄLAN */}
      <section
        id="intresse"
        style={{
          background: colors.cream,
          padding: '84px 24px',
          scrollMarginTop: 80,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 48,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: colors.teal,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Intresseanmälan
            </div>
            <h2
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 300,
                color: colors.ink,
                letterSpacing: '-1px',
                lineHeight: 1.15,
                marginBottom: 20,
              }}
            >
              Var med och forma programmet
            </h2>
            <p
              style={{
                fontSize: 16,
                color: '#4A6070',
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Lämna en intresseanmälan så hör vi av oss när programmet lanseras. Vi lovar inga
              paket eller priser ännu — men vi vill gärna veta vad ni som förvaltare skulle ha
              nytta av, så att vi bygger rätt sak.
            </p>
            <div style={{ fontSize: 13.5, color: colors.muted, lineHeight: 1.7 }}>
              Föredrar mejl?{' '}
              <a href="mailto:info@brfinfo.se" style={{ color: colors.teal, textDecoration: 'none', fontWeight: 500 }}>
                info@brfinfo.se
              </a>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '32px 28px',
              boxShadow: '0 20px 50px -24px rgba(15,31,45,0.28)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <PartnerForm />
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section style={{ background: 'white', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.7 }}>
            Vill du se registret först?{' '}
            <Link href="/forvaltare" style={{ color: colors.teal, textDecoration: 'none', fontWeight: 500 }}>
              Utforska alla förvaltare på BRFinfo →
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
