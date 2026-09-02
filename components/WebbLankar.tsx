import Link from 'next/link'
import { BrfWebb, formateraVerifierad } from '@/lib/webb'

const card: React.CSSProperties = { background: 'white', border: '1px solid rgba(15,31,45,0.09)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const cardTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 400, color: '#0F1F2D', marginBottom: 16, letterSpacing: '-0.3px' }
const lank: React.CSSProperties = { fontSize: 14, color: '#1B7C6E', textDecoration: 'none', fontWeight: 500 }
const stamp: React.CSSProperties = { fontSize: 11.5, color: '#8A9BAB', marginTop: 3 }

/** Visar värdnamnet i stället för hela URL:en — kortare och läsbart. */
function vard(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Släpper bara igenom http/https.
 *
 * Idag kan inget annat hamna i kolumnen: crawlern skriver `r.url` från requests,
 * som bara talar http(s). Men `brf_webb.kalla` har värdet 'claim' reserverat för
 * en route där en förening själv fyller i sin adress, och React blockerar inte
 * `javascript:` i href. Grinden kostar tre rader nu och gör att den routen inte
 * kan bli en lagrad XSS senare.
 */
function sakerLank(url: string | null): string | null {
  if (!url) return null
  try {
    const p = new URL(url)
    return p.protocol === 'https:' || p.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

/**
 * Länkar till föreningens egen webbplats och till sidan där den publicerar sin
 * årsredovisning.
 *
 * Kortet renderas ALDRIG när det saknar innehåll. Föreningar utan verifierad
 * hemsida ser exakt samma sida som före den här funktionen — ingen tom rubrik,
 * ingen "uppgift saknas"-rad, ingen extra höjd. Det är därför komponenten
 * returnerar null i stället för att anroparen villkorar: villkoret hör ihop med
 * innehållet och ska inte kunna glömmas bort på anropsstället.
 *
 * rel="nofollow noopener": vi går i god för att sidan tillhör föreningen, inte
 * för vad den innehåller, och skickar därför ingen länkkraft. noreferrer utelämnas
 * med flit — föreningen ska kunna se i sin statistik att besökaren kom från oss.
 *
 * Länkarna pekar på SIDOR, aldrig direkt på en PDF. Vi hotlänkar inte dokument
 * och vi återpublicerar dem inte.
 */
export default function WebbLankar({ webb }: { webb: BrfWebb | null }) {
  if (!webb) return null
  const hemsidaUrl = sakerLank(webb.hemsida_url)
  const arUrl = sakerLank(webb.arsredovisning_url)
  const harHemsida = Boolean(hemsidaUrl)
  const harAr = Boolean(arUrl)
  if (!harHemsida && !harAr) return null

  const hemsidaDatum = formateraVerifierad(webb.hemsida_verifierad_at)
  const arDatum = formateraVerifierad(webb.arsredovisning_hittad_at)

  return (
    <div style={card}>
      <h2 style={cardTitle}>Föreningens egna sidor</h2>

      {harHemsida && (
        <div style={{ marginBottom: harAr ? 16 : 0 }}>
          <a href={hemsidaUrl!} target="_blank" rel="nofollow noopener" style={lank}>
            Föreningens hemsida →
          </a>
          <div style={stamp}>
            {vard(hemsidaUrl!)}
            {hemsidaDatum && ` · Verifierad ${hemsidaDatum}`}
          </div>
        </div>
      )}

      {harAr && (
        <div>
          <a href={arUrl!} target="_blank" rel="nofollow noopener" style={lank}>
            Föreningen publicerar sin årsredovisning →
          </a>
          <div style={stamp}>
            {arDatum && `Hittad ${arDatum} · `}
            Dokumentet ligger hos föreningen. Vi läser inte innehållet.
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: '#8A9BAB', lineHeight: 1.55, marginTop: 14 }}>
        Länkarna kontrolleras maskinellt av{' '}
        <Link href="/om-boten" style={{ color: '#6A8090' }}>vår bot</Link>. Stämmer något inte?{' '}
        <Link href="/claima" style={{ color: '#6A8090' }}>Claima föreningen</Link> så rättar vi det.
      </p>
    </div>
  )
}
