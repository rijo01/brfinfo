import type { Metadata } from 'next'
import StyrelseguideKopKnapp from '@/components/StyrelseguideKopKnapp'

export const metadata: Metadata = {
  title: 'Den välskötta bostadsrättsföreningen — handbok för BRF-styrelsen',
  description: 'Premium-handbok för BRF-styrelsen: 20 kapitel i 6 delar, checklista i varje kapitel, 50 spartips, 30 vanliga misstag och ett mallpaket med 15 mallar. Faktagranskad mot primärkällor. ~89 sidor.',
  alternates: { canonical: 'https://brfinfo.se/styrelseguide' },
}

const NAVY = '#0F1F2D'
const TEAL = '#1B7C6E'
const GOLD = '#C9932A'
const CREAM = '#F5F1E8'

// Gulddetalj på mörk navy: ljusare ton för läsbarhet (samma konvention som startsidan).
const GOLD_ON_DARK = '#E8B84B'

const DELAR: Array<{ num: string; namn: string }> = [
  { num: '1', namn: 'Grunden' },
  { num: '2', namn: 'Ekonomisk kontroll' },
  { num: '3', namn: 'Sänk kostnaderna' },
  { num: '4', namn: 'De stora underhållsbesluten' },
  { num: '5', namn: 'Struktur och människor' },
  { num: '6', namn: 'Det formella året' },
]

const BILAGOR: string[] = [
  '50 konkreta spartips',
  '30 vanliga (och dyra) misstag',
  'Mallpaket med 15 redigerbara mallar',
]

type Paket = {
  tier: 'paket1' | 'paket2' | 'paket3'
  namn: string
  pris: string
  innehall: string[]
  populär: boolean
  comingSoon: boolean
  primary: boolean
}

const PAKET: Paket[] = [
  {
    tier: 'paket1',
    namn: 'Handboken',
    pris: '1 499 kr',
    innehall: ['Hela handboken som PDF', 'Nedladdning direkt efter köp'],
    populär: false,
    comingSoon: false,
    primary: true,
  },
  {
    tier: 'paket2',
    namn: 'Handboken + Mallpaket',
    pris: '2 499 kr',
    innehall: ['Hela handboken som PDF', '15 redigerbara mallar som separata filer'],
    populär: true,
    comingSoon: true,
    primary: false,
  },
  {
    tier: 'paket3',
    namn: 'Styrelsepaketet',
    pris: '4 999 kr',
    innehall: ['Allt i Handboken + Mallpaket', '60 minuters personlig genomgång'],
    populär: false,
    comingSoon: true,
    primary: false,
  },
]

// UI visar bara köpbara paket. paket2/paket3 (comingSoon) döljs tills de aktiveras —
// hela tier-datan + checkout-logiken finns kvar; sätt comingSoon:false för att åter-visa.
const VISIBLE_PAKET = PAKET.filter(p => !p.comingSoon)
const SINGLE_PAKET = VISIBLE_PAKET.length === 1

const STEG: Array<{ num: string; titel: string; text: string }> = [
  { num: '1', titel: 'Välj paket', text: 'Välj det paket som passar er styrelse och klicka på köpknappen.' },
  { num: '2', titel: 'Betala säkert', text: 'Betala med kort via Stripe — säker betalning direkt i kassan.' },
  { num: '3', titel: 'Ladda ner direkt', text: 'Du får tillgång till handboken direkt efter köpet.' },
]

const section: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '64px 24px' }
const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(24px,4vw,32px)', fontWeight: 400, color: NAVY, letterSpacing: '-0.5px', marginBottom: 14, lineHeight: 1.2 }
const lead: React.CSSProperties = { fontSize: 16, color: '#4A6070', lineHeight: 1.7, maxWidth: 640 }
const kicker: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, letterSpacing: '0.8px', textTransform: 'uppercase', color: TEAL, marginBottom: 12 }

export default function StyrelseguidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Den välskötta bostadsrättsföreningen',
        description: 'Praktisk handbok för BRF-styrelsen: 20 kapitel i 6 delar med checklista i varje kapitel, 50 spartips, 30 vanliga misstag och ett mallpaket med 15 mallar. Faktagranskad mot primärkällor. ~89 sidor.',
        brand: { '@type': 'Brand', name: 'BRFinfo.se' },
        offers: VISIBLE_PAKET.map(p => ({
          '@type': 'Offer',
          name: p.namn,
          price: p.pris.replace(/[^\d]/g, ''),
          priceCurrency: 'SEK',
          availability: 'https://schema.org/InStock',
        })),
      }) }} />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '72px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(27,124,110,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(27,124,110,0.06) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,147,42,0.12)', border: '1px solid rgba(201,147,42,0.25)', padding: '5px 14px', borderRadius: 20, fontSize: 12, color: GOLD_ON_DARK, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, background: GOLD_ON_DARK, borderRadius: '50%', display: 'inline-block' }} />
            Premium-handbok · ~89 sidor
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(32px,6vw,54px)', fontWeight: 300, color: 'white', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 }}>
            Den välskötta<br /><em style={{ color: GOLD_ON_DARK, fontStyle: 'normal' }}>bostadsrättsföreningen</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 'clamp(16px,2.5vw,19px)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 20px' }}>
            BRF-styrelsens praktiska handbok för lägre kostnader, tryggare beslut och högre fastighetsvärde.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
            Handboken ger er struktur där det idag ofta är magkänsla — konkret vägledning för de beslut som faktiskt rör föreningens pengar.
          </p>
          <a href="#paket" style={{ display: 'inline-block', background: GOLD, color: NAVY, padding: '14px 30px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Se pris →
          </a>
          {/* Förtroendesignaler — juristgranskad lyft tydligt (sant och tidigare underanvänt). */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            {['Juristgranskad', 'Faktagranskad mot primärkällor', 'Nedladdning direkt'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.72)', fontSize: 13.5 }}>
                <span style={{ color: GOLD_ON_DARK, fontWeight: 700 }}>✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FÖR VEM */}
      <section style={section}>
        <div style={kicker}>För vem</div>
        <h2 style={h2}>Skriven för dig i styrelsen</h2>
        <p style={lead}>
          Handboken vänder sig till nyvalda och sittande styrelseledamöter i bostadsrättsföreningar — oavsett om du precis tackat ja till uppdraget eller suttit i flera år och vill ha ett uppslagsverk att luta dig mot.
        </p>
      </section>

      {/* VAD DU FÅR */}
      <section style={{ background: 'white', borderTop: '1px solid rgba(15,31,45,0.07)', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={section}>
          <div style={kicker}>Vad du får</div>
          <h2 style={h2}>20 kapitel i 6 delar</h2>
          <p style={{ ...lead, marginBottom: 32 }}>
            Varje kapitel avslutas med en checklista. Innehållet är juristgranskat och faktagranskat mot primärkällor — bland andra Skatteverket, Boverket, Bolagsverket och Energimyndigheten.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 40 }}>
            {DELAR.map(d => (
              <div key={d.num} style={{ background: CREAM, border: '1px solid rgba(15,31,45,0.08)', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 30, fontWeight: 600, color: GOLD, lineHeight: 1, flexShrink: 0 }}>{d.num}</span>
                <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, color: NAVY, lineHeight: 1.25 }}>{d.namn}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            <div style={{ background: NAVY, borderRadius: 12, padding: '26px 28px' }}>
              <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 19, fontWeight: 400, color: 'white', marginBottom: 16 }}>Tre bilagor på köpet</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {BILAGOR.map(b => (
                  <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 1.5 }}>
                    <span style={{ color: GOLD_ON_DARK, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
              {[
                { stat: '~89', label: 'sidor i handboken' },
                { stat: '15', label: 'redigerbara mallar i mallpaketet' },
              ].map(s => (
                <div key={s.label} style={{ background: CREAM, border: '1px solid rgba(15,31,45,0.08)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, fontWeight: 600, color: TEAL, lineHeight: 1 }}>{s.stat}</span>
                  <span style={{ fontSize: 15, color: '#4A6070' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAKET */}
      <section id="paket" style={section}>
        <div style={kicker}>Pris</div>
        <h2 style={h2}>{SINGLE_PAKET ? 'En komplett handbok för styrelsen' : 'Välj det som passar er styrelse'}</h2>
        <p style={{ ...lead, marginBottom: 36 }}>
          {SINGLE_PAKET
            ? 'Hela handboken som PDF — juristgranskad, ~89 sidor med checklista i varje kapitel. Nedladdning direkt efter köp.'
            : 'Tre paket — från enbart handboken till hela styrelsepaketet med personlig genomgång.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: SINGLE_PAKET ? 'minmax(0,420px)' : 'repeat(auto-fit,minmax(260px,1fr))', justifyContent: SINGLE_PAKET ? 'center' : undefined, gap: 20, alignItems: 'stretch' }}>
          {VISIBLE_PAKET.map(p => (
            <div
              key={p.tier}
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                background: 'white',
                border: p.populär ? `2px solid ${TEAL}` : '1px solid rgba(15,31,45,0.12)',
                borderRadius: 16, padding: '28px 26px',
                boxShadow: p.populär ? '0 12px 32px rgba(27,124,110,0.14)' : '0 2px 10px rgba(15,31,45,0.04)',
              }}
            >
              {p.populär && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: TEAL, color: 'white', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  Mest populär
                </div>
              )}
              <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 21, fontWeight: 600, color: NAVY, marginBottom: 6, marginTop: p.populär ? 6 : 0 }}>{p.namn}</h3>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 34, fontWeight: 600, color: TEAL, letterSpacing: '-0.5px', marginBottom: 20 }}>{p.pris}</div>
              <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {[...p.innehall, ...(p.tier === 'paket1' ? ['Juristgranskad · ~89 sidor'] : [])].map(i => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14.5, color: '#3B4F5C', lineHeight: 1.5 }}>
                    <span style={{ color: GOLD, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {i}
                  </li>
                ))}
              </ul>
              <StyrelseguideKopKnapp tier={p.tier} primary={p.primary} comingSoon={p.comingSoon} />
            </div>
          ))}
        </div>
      </section>

      {/* SÅ FUNKAR DET */}
      <section style={{ background: NAVY }}>
        <div style={section}>
          <div style={{ ...kicker, color: GOLD_ON_DARK }}>Så funkar det</div>
          <h2 style={{ ...h2, color: 'white' }}>Från köp till nedladdning på minuter</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginTop: 32 }}>
            {STEG.map(s => (
              <div key={s.num} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '24px 26px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: GOLD, color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 400, color: 'white', marginBottom: 8 }}>{s.titel}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <div style={{ background: CREAM }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px' }}>
          <p style={{ fontSize: 13, color: '#6A8090', lineHeight: 1.6, margin: 0, textAlign: 'center', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Handboken är ett vägledande verktyg och ersätter inte juridisk, ekonomisk eller teknisk rådgivning. Vid avgörande beslut bör styrelsen rådgöra med sakkunnig.
          </p>
        </div>
      </div>
    </>
  )
}
