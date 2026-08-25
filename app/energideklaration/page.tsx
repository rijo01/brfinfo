import type { Metadata } from 'next'
import Link from 'next/link'
import { EnergiBadge } from '@/components/EnergiFakta'
import EnergiLeadCTA from '@/components/EnergiLeadCTA'

export const metadata: Metadata = {
  // Frågan som titel, svaret först i beskrivningen. Den gamla titeln var 82 tkn
  // (kapades) och beskrivningen 198 (kapades mitt i en fråga) — snippeten
  // annonserade ett ämne, inte ett svar, och fick 0 klick på 182 exponeringar.
  title: { absolute: 'Måste en BRF ha energideklaration? Regler och krav' },
  description: 'Ja – och den gäller i tio år. Vad lagen kräver av föreningen, vad som står i deklarationen och vad energiklass A–G betyder. Med paragrafhänvisning.',
  alternates: { canonical: 'https://brfinfo.se/energideklaration' },
}

// Intervallen är energiklassens enda faktiska definition: byggnadens
// primärenergital i procent av kravet för en ny byggnad av samma typ.
// Källa: Boverkets föreskrifter om energideklaration för byggnader.
const KLASSER: Array<{ k: string; intervall: string; txt: string }> = [
  { k: 'A', intervall: '≤ 50 %', txt: 'Högst hälften av kravet för en ny byggnad' },
  { k: 'B', intervall: '> 50–75 %', txt: 'Klart bättre än kravet för en ny byggnad' },
  { k: 'C', intervall: '> 75–100 %', txt: 'Uppfyller kravet för en ny byggnad' },
  { k: 'D', intervall: '> 100–135 %', txt: 'Över kravet för en ny byggnad' },
  { k: 'E', intervall: '> 135–180 %', txt: 'Betydligt över kravet' },
  { k: 'F', intervall: '> 180–235 %', txt: 'Långt över kravet' },
  { k: 'G', intervall: '> 235 %', txt: 'Mer än dubbelt så högt som kravet' },
]

// Lagens egen innehållsförteckning — 9 § lagen (2006:985) om energideklaration
// för byggnader.
const INNEHALL = [
  'Byggnadens energiprestanda, uttryckt som primärenergital.',
  'Om obligatorisk funktionskontroll av ventilationssystemet (OVK) har utförts.',
  'Om radonmätning har utförts i byggnaden.',
  'Rekommendationer om kostnadseffektiva åtgärder, om energiprestandan kan förbättras.',
  'Referensvärden, så att energiprestandan går att jämföra och bedöma.',
]

const FAQ = [
  { q: 'Måste en bostadsrättsförening ha energideklaration?', a: 'Ja. Enligt 5 § lagen (2006:985) om energideklaration för byggnader ska det alltid finnas en energideklaration för en byggnad där byggnaden eller en del av den upplåts med nyttjanderätt. Upplåtelse av en lägenhet med bostadsrätt sker till nyttjande (1 kap. 4 § bostadsrättslagen), vilket gör att föreningens flerbostadshus omfattas. Ansvaret ligger på byggnadens ägare, alltså föreningen.' },
  { q: 'Hur länge gäller en energideklaration?', a: 'Tio år. Lagen uttrycker det som att en energideklaration får användas i tio år efter att den har upprättats för att uppfylla skyldigheterna i lagen (6 b §). Därefter behöver föreningen låta upprätta en ny.' },
  { q: 'Vad betyder energiklass A–G?', a: 'Energiklassen sätts utifrån byggnadens primärenergital i procent av kravet för en ny byggnad av samma typ. A är högst 50 procent av kravet, C är över 75 och upp till 100 procent — en byggnad som precis uppfyller nybyggnadskravet hamnar alltså i klass C. G är över 235 procent av kravet.' },
  { q: 'Vad är primärenergital?', a: 'Primärenergital är byggnadens energiprestanda uttryckt i kWh per kvadratmeter och år, viktad efter energibärare. Sedan 1 januari 2019 anges energiprestanda som primärenergital i stället för specifik energianvändning. Det är det mått energiklassen beräknas på.' },
  { q: 'Behövs energideklaration vid försäljning?', a: 'Ja. Innan en byggnad eller en andel i en byggnad säljs ska ägaren se till att det finns en energideklaration upprättad (6 §). För en bostadsrättsförening finns kravet på en giltig deklaration dessutom löpande, oberoende av försäljning.' },
  { q: 'Vem får utföra en energideklaration?', a: 'Den ska upprättas av en certifierad energiexpert och registreras i Boverkets energideklarationsregister.' },
  { q: 'Vad kostar en energideklaration för en BRF?', a: 'Priset sätts av den certifierade energiexpert föreningen anlitar och varierar med byggnadens storlek och komplexitet. Vi anger ingen prisuppgift här eftersom vi inte har någon primärkälla för aktuella marknadspriser — begär offert från flera certifierade experter.' },
]

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 14, letterSpacing: '-0.3px' }
const p: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 12 }
const a: React.CSSProperties = { color: '#1B7C6E', textDecoration: 'none' }

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
          <Link href="/" style={a}>BRFinfo</Link>{' → '}<span>Energideklaration</span>
        </div>
      </div>

      <section style={{ background: 'linear-gradient(160deg,#0F1F2D 0%,#1A3045 100%)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(28px,5vw,44px)', fontWeight: 300, color: 'white', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 14 }}>
            Energideklaration för <em style={{ color: '#E8B84B', fontStyle: 'normal' }}>bostadsrättsföreningar</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.6, maxWidth: 620 }}>
            Vilka regler som gäller för föreningens hus, vad som står i deklarationen och vad energiklass A–G faktiskt betyder — med lagtexten som källa.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>
        <div style={card}>
          <h2 style={h2}>Måste föreningen ha en energideklaration?</h2>
          <p style={p}>
            Ja. Den som äger en byggnad ska se till att det <strong>alltid</strong> finns en energideklaration upprättad om byggnaden, eller en del av den, <strong>upplåts med nyttjanderätt</strong> (5 § lagen om energideklaration för byggnader). Upplåtelse av en lägenhet med bostadsrätt sker till nyttjande mot ersättning och utan tidsbegränsning (1 kap. 4 § bostadsrättslagen) — föreningens flerbostadshus omfattas därför av det löpande kravet.
          </p>
          <p style={p}>
            Ansvaret ligger på byggnadens ägare, alltså föreningen, och i praktiken på styrelsen. Utöver det löpande kravet ska det finnas en energideklaration innan en byggnad eller en andel i en byggnad säljs (6 §).
          </p>
          <p style={{ ...p, marginBottom: 0 }}>
            Deklarationen upprättas av en <strong>certifierad energiexpert</strong> och registreras i Boverkets energideklarationsregister.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Hur länge gäller den?</h2>
          <p style={{ ...p, marginBottom: 0 }}>
            Tio år. Lagen formulerar det som att en energideklaration <em>får användas i tio år efter att den har upprättats</em> för att uppfylla skyldigheterna i lagen (6 b §). Tioårsfristen räknas alltså från när deklarationen upprättades — inte från när den registrerades eller när huset byggdes.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Vad står i en energideklaration?</h2>
          <p style={p}>Enligt 9 § ska deklarationen ange:</p>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            {INNEHALL.map((rad, i) => (
              <li key={i} style={{ fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 8 }}>{rad}</li>
            ))}
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2}>Energiklass A–G</h2>
          <p style={p}>
            Energiklassen är <strong>relativ</strong>. Den utgår från byggnadens primärenergital i procent av kravet för en ny byggnad av samma typ — inte från ett absolut tal. Det betyder att en byggnad som precis klarar nybyggnadskravet hamnar i <strong>klass C</strong>, och att kravnivån i sin tur beror på byggnadstyp, om huset är elvärmt och var i landet det ligger.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 16 }}>
            {KLASSER.map(({ k, intervall, txt }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: '1px solid rgba(15,31,45,0.05)' }}>
                <EnergiBadge klass={k} size="sm" />
                <span style={{ fontSize: 14.5, color: '#0F1F2D', fontWeight: 500, minWidth: 92, fontVariantNumeric: 'tabular-nums' }}>{intervall}</span>
                <span style={{ fontSize: 14.5, color: '#4A6070' }}>{txt}</span>
              </div>
            ))}
          </div>
          <p style={{ ...p, marginTop: 14, marginBottom: 0, fontSize: 13.5, color: '#6A8090' }}>
            Intervallen anger primärenergitalet i procent av kravet för en ny byggnad.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>Primärenergital — vad är det?</h2>
          <p style={p}>
            Primärenergitalet anges i <strong>kWh per kvadratmeter och år</strong> och viktas efter energibärare (el, fjärrvärme och så vidare). Sedan 1 januari 2019 uttrycks byggnadens energiprestanda som primärenergital i stället för specifik energianvändning. Ett lägre tal betyder att byggnaden använder mindre energi per kvadratmeter.
          </p>
          <p style={{ ...p, marginBottom: 0 }}>
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

        <EnergiLeadCTA kalla="energideklaration-sida" />

        <div style={card}>
          <h2 style={{ ...h2, fontSize: 18 }}>Hitta din förening</h2>
          <p style={{ ...p, marginBottom: 0 }}>
            På varje föreningssida visar vi den registrerade energiklassen och primärenergitalet när vi har kunnat matcha föreningen mot Boverkets register.{' '}
            <Link href="/sok" style={a}>Sök upp din bostadsrättsförening →</Link>
          </p>
        </div>

        <div style={{ ...card, background: 'rgba(15,31,45,0.03)', marginBottom: 0 }}>
          <h2 style={{ ...h2, fontSize: 16, marginBottom: 10 }}>Källor</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ fontSize: 13.5, color: '#4A6070', lineHeight: 1.7 }}>
              <a style={a} href="https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-2006985-om-energideklaration-for-byggnader_sfs-2006-985/" target="_blank" rel="noopener noreferrer">Lag (2006:985) om energideklaration för byggnader ↗</a> — 5 §, 6 §, 6 b §, 9 §
            </li>
            <li style={{ fontSize: 13.5, color: '#4A6070', lineHeight: 1.7 }}>
              <a style={a} href="https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/bostadsrattslag-1991614_sfs-1991-614/" target="_blank" rel="noopener noreferrer">Bostadsrättslag (1991:614) ↗</a> — 1 kap. 4 §
            </li>
            <li style={{ fontSize: 13.5, color: '#4A6070', lineHeight: 1.7 }}>
              <a style={a} href="https://www.boverket.se/sv/energideklaration/energideklaration/" target="_blank" rel="noopener noreferrer">Boverket — om energideklarationer ↗</a> — energiklassernas intervall och primärenergital
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
