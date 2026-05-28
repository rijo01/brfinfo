import type { Metadata } from 'next'
import Link from 'next/link'
import { EnergiBadge } from '@/components/EnergiFakta'

export const metadata: Metadata = {
  title: 'Energideklaration för BRF — så fungerar energiklass A–G',
  description: 'Vad är en energideklaration och vad betyder energiklass A–G för en bostadsrättsförening? Faktisk förklaring av primärenergital, giltighetstid och vad uppgifterna säger om föreningens byggnad.',
  alternates: { canonical: 'https://brfinfo.se/energideklaration' },
}

const KLASSER: Array<{ k: string; txt: string }> = [
  { k: 'A', txt: 'Mycket låg energianvändning' },
  { k: 'B', txt: 'Låg energianvändning' },
  { k: 'C', txt: 'Strax under kravnivån för nya byggnader' },
  { k: 'D', txt: 'Genomsnittlig nivå för svenskt bestånd' },
  { k: 'E', txt: 'Något högre energianvändning' },
  { k: 'F', txt: 'Hög energianvändning' },
  { k: 'G', txt: 'Mycket hög energianvändning' },
]

const FAQ = [
  { q: 'Vad är en energideklaration?', a: 'En energideklaration är en lagstadgad redovisning av en byggnads energianvändning. Den utförs av en certifierad energiexpert och registreras hos Boverket. För flerbostadshus, som de flesta BRF:er äger, ska en giltig energideklaration finnas.' },
  { q: 'Hur länge gäller en energideklaration?', a: 'En energideklaration är giltig i tio år från det datum den utfördes. Därefter ska föreningen låta upprätta en ny.' },
  { q: 'Vad betyder energiklass A–G?', a: 'Energiklassen är en relativ skala där A är mycket låg energianvändning och G är mycket hög. Klassen baseras på byggnadens primärenergital (kWh/m² och år) i förhållande till kravet för en ny byggnad av samma typ.' },
  { q: 'Vad är primärenergital?', a: 'Primärenergital är byggnadens energiprestanda uttryckt i kWh per kvadratmeter och år, viktad efter energibärare. Det är det mått energiklassen beräknas på.' },
  { q: 'Var hittar jag min BRF:s energideklaration?', a: 'Uppgifterna kommer från Boverkets publika register. På BRFinfo.se visar vi den registrerade energiklassen och energiprestandan för de föreningar vi har matchat mot registret.' },
]

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 14, letterSpacing: '-0.3px' }
const p: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 12 }

export default function EnergideklarationPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BRFinfo', item: 'https://brfinfo.se' },
          { '@type': 'ListItem', position: 2, name: 'Energideklaration', item: 'https://brfinfo.se/energideklaration' },
        ],
      }) }} />

      <div style={{ background: 'white', borderBottom: '1px solid rgba(15,31,45,0.07)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '10px 24px', fontSize: 13, color: '#6A8090' }}>
          <Link href="/" style={{ color: '#1B7C6E', textDecoration: 'none' }}>BRFinfo</Link>{' → '}<span>Energideklaration</span>
        </div>
      </div>

      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(28px,5vw,44px)', fontWeight: 300, color: 'white', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 14 }}>
            Energideklaration för <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>bostadsrättsföreningar</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.6, maxWidth: 620 }}>
            Vad energiklass A–G betyder, hur primärenergital räknas och vad uppgifterna säger om föreningens byggnad — utan gissningar.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>
        <div style={card}>
          <h2 style={h2}>Vad är en energideklaration?</h2>
          <p style={p}>
            En energideklaration är en lagstadgad redovisning av hur mycket energi en byggnad använder. Den upprättas av en certifierad energiexpert och registreras hos Boverket. För de flerbostadshus som bostadsrättsföreningar äger ska det finnas en giltig deklaration, och den ska förnyas vart tionde år.
          </p>
          <p style={p}>
            Deklarationen innehåller bland annat byggnadens <strong>energiklass</strong>, dess <strong>primärenergital</strong> och uppgifter om radonmätning och ventilationskontroll (OVK). På BRFinfo.se visar vi de uppgifter som finns registrerade hos Boverket för de föreningar vi har matchat mot registret.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Energiklass A–G</h2>
          <p style={p}>
            Energiklassen är en relativ skala. Den utgår från byggnadens primärenergital jämfört med kravet för en ny byggnad av samma typ. A betyder mycket låg energianvändning, G mycket hög.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {KLASSER.map(({ k, txt }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <EnergiBadge klass={k} size="sm" />
                <span style={{ fontSize: 14.5, color: '#4A6070' }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h2 style={h2}>Primärenergital — vad är det?</h2>
          <p style={p}>
            Primärenergitalet anges i <strong>kWh per kvadratmeter och år</strong> och viktas efter energibärare (el, fjärrvärme osv). Det är det mått energiklassen beräknas på. Ett lägre tal betyder att byggnaden använder mindre energi per kvadratmeter.
          </p>
          <p style={p}>
            Vi redovisar enbart de faktiska värden som finns i Boverkets register. Vi presenterar inga uppskattade besparingar eller ekonomiska kalkyler — sådant beror på den enskilda byggnaden och bör utredas av en energiexpert.
          </p>
        </div>

        <div style={card} itemScope itemType="https://schema.org/FAQPage">
          <h2 style={h2}>Vanliga frågor</h2>
          {FAQ.map((f, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F1F2D', marginBottom: 6 }}>{f.q}</h3>
              <p style={{ fontSize: 14.5, color: '#4A6070', lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>

        <div style={{ ...card, background: 'rgba(27,124,110,0.05)', borderColor: 'rgba(27,124,110,0.2)' }}>
          <h2 style={{ ...h2, fontSize: 18 }}>Se energiklass per stad</h2>
          <p style={{ ...p, marginBottom: 8 }}>Bläddra bland bostadsrättsföreningar med registrerad energideklaration:</p>
          <Link href="/energiklass/stockholm" style={{ color: '#1B7C6E', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>Energiklass för BRF:er i Stockholm →</Link>
        </div>
      </div>
    </>
  )
}
