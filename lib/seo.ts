// Metadata-mallar för title/description. Enda syftet är vad som hamnar i SERP —
// ingenting här renderas på sidan.
//
// Bakgrund (mätt 2026-08-25 mot live + databas):
//  * BRF-titeln var median 93 tecken och kapades i 100 % av fallen, eftersom
//    suffixet "— Styrelseinfo, avgifter och kontakt | BRFinfo.se" är 49 tecken
//    och medianamnet 44. Namnet är det enda som matchar sökfrågan; allt efter
//    det är brus som ändå klipps.
//  * Suffixet lovade dessutom två datafält som 0 av 29 412 rader har
//    (styrelse = null, arsredovisning_data = null överallt). Därför är både
//    "Styrelseinfo" och "avgifter" borta ur mallen.
//
// Lösningen är att korta NAMNET, inte suffixet: "Bostadsrättsföreningen" → "Brf"
// är dessutom hur folk faktiskt söker.

const SMA_ORD = new Set(['i', 'och', 'nr', 'vid', 'av', 'på', 'för', 'de', 'den', 'ett', 'en'])

// Förkortningar som ska förbli versaler efter title-casing. HSB inleder 4 195
// föreningsnamn — "Hsb Brf …" i varje SERP-titel vore en synlig skavank.
const AKRONYMER = /\b(hsb|sbc)\b/gi

/** Bolagsverket levererar namn i VERSALER. Gemener + initial versal, utom småord. */
export function titleCase(s: string): string {
  const t = s.toLowerCase().replace(/(?:^|\s|[-/])\S/g, c => c.toUpperCase())
  return t
    .split(' ')
    .map((w, i) => (i > 0 && SMA_ORD.has(w.toLowerCase()) ? w.toLowerCase() : w))
    .join(' ')
    .replace(AKRONYMER, m => m.toUpperCase())
}

/**
 * Registret har hopskrivningar där "i" klistrats ihop med ortnamnet:
 * "Lillängen iNacka", "Vävstolen iHallstahammar". Utan städning blir det
 * "Inacka" efter title-casing. Kräver versal efter i:et så att riktiga ord
 * ("Ikea", "Ideon") lämnas i fred.
 */
export function fixaIHopskrivning(s: string): string {
  return s.replace(/\bi(?=[A-ZÅÄÖ][a-zåäö])/g, 'i ')
}

/**
 * "BOSTADSRÄTTSFÖRENINGEN SLEIPNER 18" → "Brf Sleipner 18".
 * Namn som slutar på Brf efter förkortningen får det flyttat till fronten,
 * annars blir det "Zorntorget Brf" istället för "Brf Zorntorget".
 */
export function kortnamn(namn: string): string {
  let n = titleCase(fixaIHopskrivning(namn))

  // "Abeckshyttan, Bostadsrättsföreningen" → "Brf Abeckshyttan"
  const inverterat = n.match(/^(.*?),\s*Bostadsr[äa]ttsf[öo]rening(?:en)?\s*$/i)
  if (inverterat) n = `Brf ${inverterat[1]}`

  n = n
    .replace(/\bBostadsr[äa]ttsf[öo]rening(?:en)?\b/gi, 'Brf')
    // Registret har flera avstympade varianter: BOSTADSRÄTTSFÖREN,
    // BOSTADSRÄTTSFÖR (49 rader), BOSTADSR.FÖR. Alla ska bli "Brf".
    .replace(/\bBostadsr[äa]ttsf[öo]r(?:en)?\.?\b/gi, 'Brf')
    .replace(/\bBostadsr\.?\s?f[öo]r\.?\b/gi, 'Brf')
    .replace(/\bBrf(?:\s+Brf)+\b/g, 'Brf')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()

  // Efterställt "Brf" flyttas fram: "Wallenstam nr 55 Brf" → "Brf Wallenstam nr 55"
  const efterstallt = n.match(/^(.+?)[,\s]+Brf$/)
  if (efterstallt) n = `Brf ${efterstallt[1].trim()}`

  // Om förkortningen åt upp hela namnet är originalet bättre än "Brf".
  if (!n || /^Brf$/i.test(n)) return titleCase(fixaIHopskrivning(namn))
  return n
}

/**
 * 38 % av raderna (11 277 av 29 412) har ingen gatuadress utan en postbox eller
 * fakturaadress. Postorten hör då till förvaltarens box, inte till fastigheten:
 * Brf Solgläntan i Veberöd har postort MALMÖ, Brf Vikaholms Allé 1 (Kronoberg)
 * har postort SUNDSVALL. Ortssuffix i titeln vore direkt vilseledande.
 *
 * Uppmätt fördelning: Box 10 800, FE 225, Mailbox 84, Fack 78, Kundnummer 60, c/o 30.
 */
export function arBoxadress(adress: string | null | undefined): boolean {
  return /^(box|mailbox|kundnummer|frisvar|fack|fe\b|c\/o)/i.test((adress ?? '').trim())
}

/** Första kandidaten som ryms. Sista kandidaten används oavsett längd. */
export function fit(kandidater: string[], max: number): string {
  for (const k of kandidater) if (k.length <= max) return k
  return kandidater[kandidater.length - 1]
}

// Titlarna innehåller sitt eget varumärkessuffix och måste därför sättas som
// `title: { absolute: … }`. Layoutens mall '%s | BRFinfo.se' skulle annars lägga
// på suffixet en gång till — exakt buggen som 9443d8c fixade — och samtidigt
// spränga 60-teckenstaket som hela den här modulen finns för att hålla.
export const TITEL_MAX = 60
export const DESC_MAX = 155

// ---------------------------------------------------------------- /brf/[slug]

export function brfTitle(namn: string, postort: string | null, adress: string | null): string {
  const kort = kortnamn(namn)
  const ort = postort ? titleCase(postort) : ''
  // Boxadress → hoppa över orten helt (den är förvaltarens, inte föreningens).
  // Namnet innehåller ofta redan orten ("Brf Svindersvik i Nacka") — då blir
  // suffixet en dubblering: "Brf Svindersvik i Nacka – Nacka".
  const ortRedanINamnet = ort !== '' && kort.toLowerCase().includes(ort.toLowerCase())
  if (!ort || ortRedanINamnet || arBoxadress(adress)) {
    return fit([`${kort} | BRFinfo.se`, kort], TITEL_MAX)
  }
  return fit([`${kort} – ${ort} | BRFinfo.se`, `${kort} – ${ort}`, `${kort} | BRFinfo.se`, kort], TITEL_MAX)
}

// Länet är MEDVETET utelämnat. Register-länet motsäger ofta postorten —
// uppmätt i stickprovet: "Brf Loggen 2 i Umeå, Västernorrland" (Umeå ligger i
// Västerbotten), "Brf Vikaholms Allé 1 … Sundsvall, Kronoberg". Att skriva ihop
// dem till "i {ort}, {län}" påstår ett samband som datan inte bär. Orten ensam
// är det som söks på ändå, och utrymmet går till gatuadressen istället.
export function brfDescription(args: {
  namn: string
  postort: string | null
  lan?: string | null
  orgnr: string
  ar: string
  status: string | null
  adress: string | null
}): string {
  const kort = kortnamn(args.namn)
  const ort = args.postort ? titleCase(args.postort) : ''
  const box = arBoxadress(args.adress)

  const status = args.status === 'Är verksam' ? 'aktiv' : (args.status ?? '').toLowerCase()
  const fakta = [
    `Org.nr ${args.orgnr}`,
    args.ar && args.ar !== 'Okänt' ? `bildad ${args.ar}` : '',
    status,
  ].filter(Boolean).join(', ')

  if (box) {
    // Ingen "i {ort}" — postorten är boxens. Anges som postadress, vilket är sant.
    const huvud = `${kort}. ${fakta}.`
    return fit([
      ort ? `${huvud} Postadress ${ort}. Registeruppgifter från Bolagsverket.` : '',
      `${huvud} Registeruppgifter från Bolagsverket.`,
      huvud,
    ].filter(Boolean), DESC_MAX)
  }

  // Samma dubbleringsskydd som i titeln: "Brf Svindersvik i Nacka i Nacka."
  const ortRedanINamnet = ort !== '' && kort.toLowerCase().includes(ort.toLowerCase())
  const huvud = ort && !ortRedanINamnet ? `${kort} i ${ort}. ${fakta}.` : `${kort}. ${fakta}.`
  const gata = args.adress ? titleCase(args.adress) : ''
  return fit([
    gata ? `${huvud} Adress ${gata}. Uppgifter från Bolagsverket.` : '',
    `${huvud} Registeruppgifter från Bolagsverket.`,
    huvud,
  ].filter(Boolean), DESC_MAX)
}

// --------------------------------------------------------------- /stad/[city]

/**
 * Städer där postort-antalet INTE beskriver staden. getBRFCountByCity räknar på
 * postort, och dessa två orter är förvaltarnas postboxnav — de flesta träffarna
 * ligger någon helt annanstans. Uppmätt andel som faktiskt hör till kommunen
 * (stickprov 1 000 rader): Umeå 89 % (normal stad), Östersund 19 %, Sundsvall
 * 5 % — där är toppkommunerna Stockholm 258, Uppsala 101, Göteborg 84.
 *
 * Siffran finns redan i sidans brödtext, men att lyfta "4 208
 * bostadsrättsföreningar i Sundsvall" till SERP-titeln vore att marknadsföra
 * felet. Dessa faller tillbaka på titeln utan antal tills count räknas på
 * kommun i stället för postort.
 */
const POSTORTSNAV = new Set(['sundsvall', 'östersund'])

function tillforlitligtAntal(stad: string, count: number | null): number | null {
  return POSTORTSNAV.has(stad.toLowerCase()) ? null : count
}

export function stadTitle(stad: string, raktAntal: number | null): string {
  const namn = titleCase(stad)
  const count = tillforlitligtAntal(stad, raktAntal)
  if (count != null && count > 0) {
    const n = count.toLocaleString('sv-SE')
    return fit([`${n} bostadsrättsföreningar i ${namn} | BRFinfo.se`, `${n} bostadsrättsföreningar i ${namn}`, `BRF i ${namn} | BRFinfo.se`], TITEL_MAX)
  }
  return fit([`BRF i ${namn} – org.nr, adress och kontakt | BRFinfo.se`, `BRF i ${namn} – org.nr och adress`, `BRF i ${namn} | BRFinfo.se`], TITEL_MAX)
}

export function stadDescription(stad: string, raktAntal: number | null, areas?: string[]): string {
  const namn = titleCase(stad)
  const count = tillforlitligtAntal(stad, raktAntal)
  const bas = count != null && count > 0
    ? `${count.toLocaleString('sv-SE')} bostadsrättsföreningar i ${namn} med org.nr, adress, bildandeår och status.`
    : `BRF:er i ${namn} med org.nr, adress, bildandeår och status.`

  const omraden = areas ?? []
  const kandidater: string[] = []
  // 3 → 2 → 1 stadsdelar, droppa tills beskrivningen ryms i 155.
  for (const k of [3, 2, 1]) {
    if (omraden.length >= k) kandidater.push(`${bas} Sök på namn eller bläddra per stadsdel: ${omraden.slice(0, k).join(', ')}.`)
  }
  kandidater.push(`${bas} Sök på föreningens namn.`)
  kandidater.push(bas)
  return fit(kandidater, DESC_MAX)
}
