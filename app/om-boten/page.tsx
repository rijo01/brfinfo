import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Om brfinfo-bot',
  description: 'Vad BRFinfo:s bot gör, vilka sidor den hämtar och hur du blockerar den via robots.txt. Boten läser inga dokument och sparar inga personuppgifter.',
  alternates: { canonical: 'https://brfinfo.se/om-boten' },
}

export default function OmBotenPage() {
  const h2: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 400, color: '#0F1F2D', marginBottom: 12, marginTop: 36, letterSpacing: '-0.3px' }
  const p: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 12 }
  const li: React.CSSProperties = { fontSize: 15, color: '#4A6070', lineHeight: 1.7, marginBottom: 6 }
  const a: React.CSSProperties = { color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }
  const pre: React.CSSProperties = { background: '#0F1F2D', color: '#E6EDF3', borderRadius: 10, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.65, fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace', overflowX: 'auto', marginBottom: 12 }

  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px' }}>
      <span style={{ display: 'inline-block', background: 'rgba(27,124,110,0.1)', color: '#1B7C6E', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 20 }}>
        För webbansvariga
      </span>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 36, fontWeight: 300, color: '#0F1F2D', letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.15 }}>
        Om brfinfo-bot
      </h1>
      <p style={{ ...p, fontSize: 16 }}>
        Om du hittade den här sidan kommer du förmodligen från en rad i din webbserverlogg.
        Den här sidan förklarar vad boten gör, vad den inte gör, och hur du stänger av den.
        Adressen finns i botens User-Agent just för att du ska kunna göra det utan att fråga oss.
      </p>

      <div style={{ background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '18px 22px', marginTop: 24 }}>
        <div style={{ fontSize: 11, color: '#8A9BAB', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>User-Agent</div>
        <code style={{ fontSize: 13.5, color: '#0F1F2D', fontFamily: 'IBM Plex Mono, ui-monospace, monospace', wordBreak: 'break-all' }}>
          brfinfo-bot (+https://brfinfo.se/om-boten; info@brfinfo.se)
        </code>
      </div>

      <h2 style={h2}>Vad boten gör</h2>
      <p style={p}>
        BRFinfo listar Sveriges bostadsrättsföreningar med uppgifter från Bolagsverket och SCB.
        Många föreningar har en egen webbplats, och den uppgiften finns inte i något offentligt
        register. Boten besöker därför föreningens sajt för att kontrollera två saker:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li style={li}>att adressen fungerar och faktiskt tillhör föreningen — vi letar efter
          föreningens namn eller organisationsnummer på sidan, så att vi inte länkar fel</li>
        <li style={li}>om föreningen själv publicerar sin årsredovisning, så att vi kan länka
          till den sidan hos er i stället för att besökaren letar</li>
      </ul>
      <p style={p}>
        Resultatet blir två länkar på föreningens sida hos oss: <em>Föreningens hemsida</em> och
        <em> Föreningen publicerar sin årsredovisning</em>, med datum för när kontrollen gjordes.
        Länkarna går till era sidor och skickar besökare till er.
      </p>

      <h2 style={h2}>Vad boten inte gör</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li style={li}><strong>Laddar inte ner era PDF:er.</strong> Boten noterar att en sida länkar
          till en årsredovisning. Den hämtar inte dokumentet och läser inte innehållet.</li>
        <li style={li}><strong>Extraherar inga siffror.</strong> Vi kopierar inte er ekonomi till
          våra sidor. Vi länkar till er.</li>
        <li style={li}><strong>Sparar inga personuppgifter.</strong> Styrelseledamöter, revisorer och
          kontaktpersoner läses inte in och lagras inte. Vi sparar URL:er och tidsstämplar.</li>
        <li style={li}><strong>Går inte bakom inloggning.</strong> Sidor som kräver inloggning är inte
          publicerade, och boten försöker aldrig komma åt dem.</li>
        <li style={li}><strong>Byter inte identitet.</strong> Boten uppger alltid samma User-Agent.
          Svarar er server 403 på den, så tolkar vi det som ett nej och försöker inte igen förklädd.</li>
      </ul>

      <h2 style={h2}>Hur den beter sig</h2>
      <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
        <li style={li}>Högst <strong>1 förfrågan per sekund</strong> mot samma webbplats.</li>
        <li style={li}>Högst <strong>20 sidor per webbplats</strong>, sedan slutar den.</li>
        <li style={li}>Besöker en förenings sajt <strong>ungefär en gång per kvartal</strong> för att
          se att länken fortfarande fungerar.</li>
        <li style={li}>Följer bara vanliga länkar. Fyller aldrig i formulär och klickar aldrig på knappar.</li>
      </ul>

      <h2 style={h2}>Så blockerar du boten</h2>
      <p style={p}>
        Lägg det här i <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13.5 }}>robots.txt</code> i
        roten av er webbplats. Boten hämtar filen före varje besök och slutar direkt.
      </p>
      <pre style={pre}>{`User-agent: brfinfo-bot
Disallow: /`}</pre>
      <p style={p}>
        Vill du bara hålla oss borta från en del av sajten fungerar det också:
      </p>
      <pre style={pre}>{`User-agent: brfinfo-bot
Disallow: /medlem/
Disallow: /dokument/`}</pre>
      <p style={p}>
        Vi respekterar dessutom en generell <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13.5 }}>User-agent: *</code>-regel.
        Och blockerar din robots.txt AI-crawlers som <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13.5 }}>GPTBot</code> eller{' '}
        <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13.5 }}>ClaudeBot</code> med{' '}
        <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13.5 }}>Disallow: /</code> så håller vi oss borta även då —
        vi är ingen av dem, men vi läser det som att du inte vill ha maskinell återanvändning, och det räcker för oss.
      </p>

      <h2 style={h2}>Ta bort eller rätta en länk</h2>
      <p style={p}>
        Vill du att vi tar bort länken till er, eller pekar den någon annanstans, mejla{' '}
        <a href="mailto:info@brfinfo.se" style={a}>info@brfinfo.se</a> med föreningens
        organisationsnummer. Vi rättar utan att kräva att ni motiverar det. Ni kan också{' '}
        <Link href="/claima" style={a}>claima föreningens sida</Link> och sköta uppgifterna själva.
      </p>

      <h2 style={h2}>Kontakt</h2>
      <p style={p}>
        <a href="mailto:info@brfinfo.se" style={a}>info@brfinfo.se</a> — vi svarar på frågor om boten,
        även från er som bara vill veta varför den var förbi.{' '}
        <Link href="/integritet" style={a}>Integritetspolicy</Link>.
      </p>
    </div>
  )
}
