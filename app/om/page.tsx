import type { Metadata } from 'next'
import Link from 'next/link'
import { BOLAG } from '@/lib/bolag'

export const metadata: Metadata = {
  title: 'Om BRFinfo.se — vem vi är och var datan kommer ifrån',
  description: 'BRFinfo.se är ett öppet register över Sveriges bostadsrättsföreningar. Så samlas datan in, vad den täcker, var den brister och hur du får en uppgift rättad.',
  alternates: { canonical: 'https://brfinfo.se/om' },
}

export default function OmPage() {
  const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12, marginTop: 36, letterSpacing: '-0.3px' }
  const p: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 12 }
  const li: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 6 }
  const a: React.CSSProperties = { color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }
  const rad: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, padding: '10px 0', borderBottom: '1px solid rgba(15,31,45,0.06)', fontSize: 15 }

  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px' }}>
      <span style={{ display: 'inline-block', background: 'rgba(27,124,110,0.1)', color: '#1B7C6E', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 20 }}>
        Om oss
      </span>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.15 }}>
        Om BRFinfo.se
      </h1>
      <p style={{ ...p, fontSize: 16 }}>
        BRFinfo.se är ett öppet register över Sveriges bostadsrättsföreningar. Vi samlar de
        uppgifter som redan är offentliga, ger varje förening en egen sida och gör dem
        sökbara. Sajten är gratis att använda och finansieras av annonser och av de tjänster
        vi säljer till styrelser.
      </p>

      <h2 style={h2} id="sa-funkar-datan">Så funkar datan</h2>
      <p style={p}>
        Vi hittar inte på några uppgifter och vi räknar inte fram några nyckeltal. Allt som
        står på en föreningssida kommer från en namngiven källa:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li style={li}><strong>Bolagsverket</strong> — organisationsnummer, registrerat namn,
          adress, bildandeår, status, verksamhetsbeskrivning, SNI-koder och den c/o-adress som
          visar vilken förvaltare som tar emot posten.</li>
        <li style={li}><strong>SCB</strong> — bransch- och områdesindelning.</li>
        <li style={li}><strong>Boverkets energideklarationsregister</strong> — energiklass och
          energiprestanda, där en deklaration finns registrerad på föreningens adress.</li>
        <li style={li}><strong>Föreningen själv</strong> — en styrelse som{' '}
          <Link style={a} href="/claima">claimar sin sida</Link> kan lägga till och rätta uppgifter.</li>
      </ul>

      <h2 style={h2}>Vad vi inte har</h2>
      <p style={p}>
        Det är lika viktigt. Registret innehåller <strong>ingen styrelsesammansättning, inga
        månadsavgifter och inga nyckeltal ur årsredovisningen</strong>. Bolagsverket lämnar ut
        bostadsrättsföreningars årsredovisningar som inskannad PDF, inte som maskinläsbar data,
        så de siffrorna finns helt enkelt inte att hämta. Ser du dem påstådda någonstans på
        sajten är det ett fel — hör av dig.
      </p>

      <h2 style={h2}>Var datan brister</h2>
      <p style={p}>
        Registerdata är inte samma sak som korrekt data. Två saker är värda att känna till
        innan du litar på en uppgift:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li style={li}><strong>Postorten är ofta förvaltarens, inte föreningens.</strong> 38 % av
          föreningarna har en box- eller fakturaadress registrerad. Då hör postorten till den
          som sköter posten. En förening i Veberöd kan stå med postort Malmö.</li>
        <li style={li}><strong>Ort, kommun och län kan motsäga varandra.</strong> Fälten
          uppdateras inte i takt i källregistret. Vi visar dem som de står, utan att skriva ihop
          dem till en mening som påstår ett samband datan inte bär.</li>
      </ul>
      <p style={p}>
        Vi rättar inte källdata på egen hand — det vore att gissa. Stämmer något inte:{' '}
        <Link style={a} href="/claima">claima föreningens sida</Link> eller mejla oss, så
        rättar vi det som går att rätta och rapporterar resten vidare.
      </p>

      <h2 style={h2}>Personuppgifter</h2>
      <p style={p}>
        En del av kontaktuppgifterna i registret tillhör enskilda personer snarare än
        föreningen. Vi visar därför inte mobilnummer på föreningssidorna. Hur vi behandlar
        personuppgifter i övrigt står i vår{' '}
        <Link style={a} href="/integritet">integritetspolicy</Link>.
      </p>

      <h2 style={h2}>Vem som står bakom</h2>
      <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '8px 24px 16px', marginBottom: 12 }}>
        <div style={rad}><span style={{ color: '#6A8090' }}>Utgivare</span><span style={{ fontWeight: 500, color: '#1A2B38' }}>{BOLAG.namn}</span></div>
        {BOLAG.orgnr && <div style={rad}><span style={{ color: '#6A8090' }}>Organisationsnummer</span><span style={{ fontWeight: 500, color: '#1A2B38' }}>{BOLAG.orgnr}</span></div>}
        <div style={{ ...rad, borderBottom: 'none' }}><span style={{ color: '#6A8090' }}>E-post</span><a style={a} href={`mailto:${BOLAG.epost}`}>{BOLAG.epost}</a></div>
      </div>
      <p style={p}>
        Frågor, rättelser eller pressärenden går via{' '}
        <Link style={a} href="/kontakt">kontaktsidan</Link>.
      </p>
    </div>
  )
}
