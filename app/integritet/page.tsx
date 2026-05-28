import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Integritetspolicy',
  description: 'Så hanterar BRFinfo.se personuppgifter, cookies och annonser. Information om Google AdSense, samtycke och dina rättigheter enligt GDPR.',
  alternates: { canonical: 'https://brfinfo.se/integritet' },
}

export default function IntegritetPage() {
  const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12, marginTop: 36, letterSpacing: '-0.3px' }
  const p: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 12 }
  const li: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 6 }
  const a: React.CSSProperties = { color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }

  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px' }}>
      <span style={{ display: 'inline-block', background: 'rgba(27,124,110,0.1)', color: '#1B7C6E', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 20 }}>
        Juridik
      </span>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.15 }}>
        Integritetspolicy
      </h1>
      <p style={{ ...p, fontSize: 16 }}>
        Den här policyn beskriver hur BRFinfo.se samlar in, använder och skyddar information när du
        besöker sajten, samt hur vi använder cookies och annonser. Vi följer dataskyddsförordningen (GDPR).
      </p>

      <h2 style={h2}>Vilka uppgifter vi behandlar</h2>
      <p style={p}>
        BRFinfo.se visar offentlig information om bostadsrättsföreningar (t.ex. namn, org.nr och adress)
        som hämtas från Bolagsverket och SCB. När du fyller i ett kontakt- eller intresseformulär behandlar
        vi de uppgifter du själv lämnar (t.ex. namn, e-post och meddelande) för att kunna svara dig.
      </p>

      <h2 style={h2}>Cookies</h2>
      <p style={p}>
        En cookie är en liten textfil som sparas i din webbläsare. Vi använder två typer:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li style={li}><strong>Nödvändiga cookies</strong> — krävs för att sajten ska fungera och för att
          komma ihåg dina val (t.ex. ditt cookie-samtycke). Dessa kräver inte ditt samtycke.</li>
        <li style={li}><strong>Analys- och annonscookies</strong> — används för statistik (Google Analytics)
          och för att visa relevanta annonser (Google AdSense). Dessa laddas endast om du klickar
          <strong> "Acceptera alla"</strong> i cookie-rutan.</li>
      </ul>

      <h2 style={h2}>Annonser och Google AdSense</h2>
      <p style={p}>
        Sajten finansieras delvis av annonser via Google AdSense. När du har accepterat alla cookies kan
        Google och dess partners använda cookies för att visa annonser baserat på dina tidigare besök på
        denna och andra webbplatser. AdSense-skriptet laddas <strong>inte</strong> förrän du gett ditt
        samtycke via cookie-rutan; väljer du "Endast nödvändiga" laddas inga annons- eller analyscookies.
      </p>
      <p style={p}>
        Du kan läsa mer om hur Google använder data på{' '}
        <a style={a} href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
          policies.google.com/technologies/partner-sites
        </a>{' '}
        och hantera dina annonsinställningar på{' '}
        <a style={a} href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
          adssettings.google.com
        </a>.
      </p>

      <h2 style={h2}>Ändra ditt samtycke</h2>
      <p style={p}>
        Du kan när som helst ändra eller återkalla ditt samtycke genom att rensa webbplatsens cookies/lagring
        i din webbläsare — då visas cookie-rutan igen vid nästa besök.
      </p>

      <h2 style={h2}>Dina rättigheter</h2>
      <p style={p}>
        Enligt GDPR har du rätt att begära tillgång till, rättelse av eller radering av dina personuppgifter,
        samt att invända mot viss behandling. Kontakta oss så hjälper vi dig.
      </p>

      <h2 style={h2}>Kontakt</h2>
      <p style={p}>
        Har du frågor om hur vi hanterar dina uppgifter? Hör av dig via{' '}
        <Link style={a} href="/kontakt">kontaktsidan</Link> eller mejla{' '}
        <a style={a} href="mailto:info@brfinfo.se">info@brfinfo.se</a>.
      </p>
    </div>
  )
}
