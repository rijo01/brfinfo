import type { Metadata } from 'next'
import Link from 'next/link'
import PartnerForm from './PartnerForm'

export const metadata: Metadata = {
  title: 'Bli partner — Nå 26 795 BRF-styrelser direkt | För förvaltningsbolag',
  description:
    'BRFinfo.se är Sveriges största BRF-register med 26 795 föreningar. Bli partner och nå styrelser som aktivt letar efter förvaltning. Från 490 kr/mån.',
  alternates: { canonical: 'https://brfinfo.se/forvaltare-partner' },
  openGraph: {
    title: 'Nå 26 795 BRF-styrelser direkt — Partnerprogram för förvaltare',
    description:
      'Bli synlig på Sveriges största BRF-register. Tre paket från 490 kr/mån.',
    url: 'https://brfinfo.se/forvaltare-partner',
    type: 'website',
  },
}

const TOP_FORVALTARE = [
  { name: 'Riksbyggen', brfs: '4 200+' },
  { name: 'SBC', brfs: '2 800+' },
  { name: 'HSB', brfs: '3 900+' },
  { name: 'MBF', brfs: '1 100+' },
  { name: 'Bredablick', brfs: '850+' },
]

const PACKAGES = [
  {
    id: 'bas',
    name: 'Bas',
    price: '490',
    tagline: 'Synlighet och grunddata',
    highlight: false,
    features: [
      'Verifierad företagsprofil',
      'Logotyp på era BRF-sidor',
      'Lista över alla era BRF:er',
      'Direktlänk till er kontaktsida',
      'Månadsstatistik via e-post',
    ],
  },
  {
    id: 'partner',
    name: 'Partner',
    price: '990',
    tagline: 'Aktiv leadgenerering',
    highlight: true,
    features: [
      'Allt i Bas',
      'Lead-formulär på era BRF-sidor',
      'CSV-export: alla era BRF:er + kontaktdata',
      'Tillgång till nyregistrerade BRF:er i ert område',
      'API-åtkomst (1 000 anrop/mån)',
      'Prioriterad placering i sökresultat',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '2 490',
    tagline: 'Full datatillgång och tillväxt',
    highlight: false,
    features: [
      'Allt i Partner',
      'Konkurrentanalys — vilka BRF:er andra förvaltar',
      'Bevakning: BRF:er som byter förvaltare',
      'Obegränsad API-åtkomst',
      'Dedikerad partneransvarig',
      'Skräddarsydda dataexporter',
      'Egen sponsrad sida (/forvaltare/[ert-namn])',
    ],
  },
]

const FAQ = [
  {
    q: 'Hur många styrelser når jag faktiskt?',
    a: 'Vi indexerar samtliga 26 795 BRF:er i Sverige. Styrelser, kassörer och förtroendevalda besöker BRFinfo.se aktivt för att jämföra förvaltare, avgifter och grannar. Premium-partners får statistik per BRF.',
  },
  {
    q: 'Vad är skillnaden mot att annonsera på Hemnet eller Google?',
    a: 'Vi visar er specifikt för personer som redan letar information om sin egen BRF — alltså aktiva styrelsemedlemmar, inte slumpvis trafik. Dessutom vet vi exakt vilka BRF:er ni redan förvaltar och vilka som ligger i ert geografiska upptagningsområde.',
  },
  {
    q: 'Kan jag säga upp när som helst?',
    a: 'Ja. Inga bindningstider. Du betalar månadsvis och kan avsluta inför nästa månad.',
  },
  {
    q: 'Hur snabbt är jag igång?',
    a: 'Inom 24 timmar från undertecknat avtal. Vi importerar er BRF-lista, sätter upp logotyp och länkar och aktiverar lead-formulär.',
  },
  {
    q: 'Hur vet ni vilka BRF:er vi förvaltar?',
    a: 'Vi kombinerar Bolagsverkets register med årsredovisningar, hemsidedata och offentliga upphandlingar. Ni får alltid godkänna och korrigera listan innan publicering.',
  },
]

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

export default function ForvaltarePartnerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'BRFinfo Partnerprogram för förvaltningsbolag',
            description:
              'Partnerskap för förvaltningsbolag som vill nå Sveriges 26 795 bostadsrättsföreningar.',
            brand: { '@type': 'Brand', name: 'BRFinfo.se' },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'SEK',
              lowPrice: '490',
              highPrice: '2490',
              offerCount: 3,
              url: 'https://brfinfo.se/forvaltare-partner',
            },
          }),
        }}
      />

      {/* HERO */}
      <section
        style={{
          background: `linear-gradient(160deg, ${colors.ink} 0%, ${colors.inkLight} 100%)`,
          padding: '96px 24px 110px',
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

        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
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
            Partnerprogram för förvaltare
          </div>

          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 300,
              color: 'white',
              lineHeight: 1.05,
              letterSpacing: '-2px',
              marginBottom: 24,
              maxWidth: 900,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Nå <em style={{ color: colors.goldLight, fontStyle: 'normal' }}>26 795</em>{' '}
            BRF-styrelser direkt
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 19,
              lineHeight: 1.6,
              maxWidth: 620,
              margin: '0 auto 40px',
            }}
          >
            BRFinfo.se är Sveriges största oberoende BRF-register. Vi vet exakt vilka föreningar ni redan förvaltar — och vilka som söker en ny förvaltare just nu.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 56 }}>
            <a
              href="#paket"
              style={{
                background: colors.gold,
                color: colors.ink,
                padding: '15px 32px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.2px',
              }}
            >
              Se paket och priser →
            </a>
            <a
              href="#boka"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '15px 32px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Boka demo
            </a>
          </div>

          {/* KPI Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 1,
              maxWidth: 880,
              margin: '0 auto',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {[
              { num: '26 795', label: 'BRF:er indexerade' },
              { num: '578 000+', label: 'Lägenheter' },
              { num: '290', label: 'Kommuner' },
              { num: 'Dagligen', label: 'Uppdaterat' },
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
                    fontSize: 26,
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
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: colors.cream, padding: '36px 24px', borderBottom: '1px solid rgba(15,31,45,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: colors.muted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            Vi har data om Sveriges största förvaltare
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {TOP_FORVALTARE.map(f => (
              <div
                key={f.name}
                style={{
                  textAlign: 'center',
                  padding: '14px 12px',
                  background: 'white',
                  borderRadius: 10,
                  border: '1px solid rgba(15,31,45,0.06)',
                }}
              >
                <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, color: colors.ink, fontWeight: 500, letterSpacing: '-0.3px' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 2 }}>{f.brfs} BRF:er</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section style={{ background: 'white', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
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
              Varför BRFinfo
            </div>
            <h2
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 'clamp(30px, 4.5vw, 44px)',
                fontWeight: 300,
                color: colors.ink,
                letterSpacing: '-1px',
                lineHeight: 1.15,
                maxWidth: 720,
                margin: '0 auto',
              }}
            >
              Vi vet <em style={{ color: colors.teal, fontStyle: 'normal' }}>exakt</em> vilka BRF:er varje förvaltare har
            </h2>
            <p
              style={{
                fontSize: 16,
                color: colors.muted,
                lineHeight: 1.6,
                maxWidth: 600,
                margin: '20px auto 0',
              }}
            >
              Andra plattformar gissar. Vi kopplar data från Bolagsverket, årsredovisningar, hemsidor och offentliga upphandlingar.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {[
              {
                icon: '01',
                title: 'Exakt BRF-mappning',
                body: 'Vi vet vilka 4 218 BRF:er Riksbyggen förvaltar, vilka 2 836 SBC har och så vidare — ner till orgnr-nivå.',
              },
              {
                icon: '02',
                title: 'Bevakning av byten',
                body: 'När en BRF byter förvaltare ser vi det i årsredovisningen. Premium-partners får en notifikation samma dag.',
              },
              {
                icon: '03',
                title: 'Aktiv styrelse-trafik',
                body: 'BRFinfo besöks dagligen av styrelsemedlemmar som jämför avgifter, förvaltning och grannar.',
              },
              {
                icon: '04',
                title: 'Geografisk precision',
                body: 'Filtrera på kommun, stadsdel eller postnummer. Endast leads från ert faktiska upptagningsområde.',
              },
              {
                icon: '05',
                title: 'Verifierade data',
                body: 'Direkt från Bolagsverket och SCB, dagligen uppdaterad. Inga inaktuella listor.',
              },
              {
                icon: '06',
                title: 'Inga säljkonsulter',
                body: 'Allt sker via plattformen. Ni betalar inte provision på leads — bara en månadsavgift.',
              },
            ].map(c => (
              <div
                key={c.title}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  padding: '28px 26px',
                  background: 'white',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 13,
                    color: colors.gold,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    marginBottom: 12,
                  }}
                >
                  {c.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 19,
                    fontWeight: 500,
                    color: colors.ink,
                    marginBottom: 8,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {c.title}
                </h3>
                <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.6 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="paket"
        style={{ background: colors.cream, padding: '100px 24px', scrollMarginTop: 80 }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
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
              Tre paket — inga bindningstider
            </div>
            <h2
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 'clamp(30px, 4.5vw, 44px)',
                fontWeight: 300,
                color: colors.ink,
                letterSpacing: '-1px',
                lineHeight: 1.15,
              }}
            >
              Välj nivå som passar er tillväxt
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            {PACKAGES.map(p => (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  background: p.highlight ? colors.ink : 'white',
                  border: p.highlight ? `1px solid ${colors.gold}` : `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: '36px 32px',
                  boxShadow: p.highlight ? '0 24px 60px -20px rgba(15,31,45,0.4)' : '0 4px 16px -8px rgba(15,31,45,0.08)',
                  transform: p.highlight ? 'translateY(-8px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {p.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: colors.gold,
                      color: colors.ink,
                      padding: '5px 14px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Mest populär
                  </div>
                )}

                <div
                  style={{
                    fontSize: 11,
                    color: p.highlight ? colors.goldLight : colors.teal,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {p.tagline}
                </div>
                <h3
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 28,
                    fontWeight: 500,
                    color: p.highlight ? 'white' : colors.ink,
                    marginBottom: 18,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {p.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 28 }}>
                  <span
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 44,
                      fontWeight: 400,
                      color: p.highlight ? colors.goldLight : colors.ink,
                      letterSpacing: '-1.5px',
                      lineHeight: 1,
                    }}
                  >
                    {p.price}
                  </span>
                  <span style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.55)' : colors.muted }}>
                    kr/mån
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                  {p.features.map(f => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        gap: 10,
                        fontSize: 14,
                        color: p.highlight ? 'rgba(255,255,255,0.85)' : '#3A4F60',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          color: p.highlight ? colors.goldLight : colors.teal,
                          flexShrink: 0,
                          fontWeight: 700,
                          marginTop: 1,
                        }}
                      >
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#boka"
                  style={{
                    display: 'block',
                    background: p.highlight ? colors.gold : 'transparent',
                    border: p.highlight ? 'none' : `1px solid ${colors.ink}`,
                    color: p.highlight ? colors.ink : colors.ink,
                    padding: '13px 20px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                    letterSpacing: '0.2px',
                  }}
                >
                  Välj {p.name} →
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: colors.muted, marginTop: 32 }}>
            Alla priser exkl. moms. Faktureras månadsvis. Inga uppstartskostnader.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'white', padding: '100px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
              Vanliga frågor
            </div>
            <h2
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 300,
                color: colors.ink,
                letterSpacing: '-0.8px',
              }}
            >
              Det ni undrar — innan ni mejlar
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAQ.map((item, i) => (
              <details
                key={i}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: '20px 24px',
                  background: 'white',
                }}
              >
                <summary
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: colors.ink,
                    cursor: 'pointer',
                    fontFamily: 'Fraunces, Georgia, serif',
                    letterSpacing: '-0.2px',
                    listStyle: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  {item.q}
                  <span style={{ color: colors.gold, fontSize: 18, fontWeight: 300 }}>+</span>
                </summary>
                <p
                  style={{
                    fontSize: 14.5,
                    color: colors.muted,
                    lineHeight: 1.7,
                    marginTop: 14,
                  }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section
        id="boka"
        style={{
          background: `linear-gradient(160deg, ${colors.ink} 0%, ${colors.inkLight} 100%)`,
          padding: '100px 24px',
          scrollMarginTop: 80,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden style={{ position: 'absolute', top: -100, right: -100, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,147,42,0.18), transparent 70%)', pointerEvents: 'none' }} />

        <div
          style={{
            position: 'relative',
            maxWidth: 960,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 56,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: colors.goldLight,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              Boka demo
            </div>
            <h2
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 'clamp(30px, 4.5vw, 44px)',
                fontWeight: 300,
                color: 'white',
                letterSpacing: '-1px',
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              Prata med oss <em style={{ color: colors.goldLight, fontStyle: 'normal' }}>idag</em>
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              30 minuter — vi visar exakt vilka BRF:er ni redan har, vilka ni borde ha och hur ni når dem.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              {[
                'Personlig demo inom 24 timmar',
                'Exempel på BRF-lista för ert område',
                'Inget köptryck — bara data',
              ].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: colors.goldLight, fontWeight: 700 }}>✓</span>
                  {s}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 13.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
              Föredrar mejl?{' '}
              <a href="mailto:info@brfinfo.se" style={{ color: colors.goldLight, textDecoration: 'none', fontWeight: 500 }}>
                info@brfinfo.se
              </a>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '36px 32px',
              boxShadow: '0 30px 60px -20px rgba(0,0,0,0.4)',
            }}
          >
            <PartnerForm />
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section style={{ background: colors.cream, padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              fontWeight: 300,
              color: colors.ink,
              letterSpacing: '-0.8px',
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            Redo att börja?
          </h2>
          <p style={{ fontSize: 15, color: colors.muted, lineHeight: 1.7, marginBottom: 24 }}>
            Eller utforska först:{' '}
            <Link href="/forvaltare" style={{ color: colors.teal, textDecoration: 'none', fontWeight: 500 }}>
              se alla förvaltare i registret →
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
