// Visning av kontaktuppgifter på /brf/[slug].
//
// Två saker: svensk formatering av telefonnummer, och en GDPR-spärr för
// mobilnummer.

/**
 * Riktnummer med TRE siffror. Övriga fasta nummer har fyra (0176, 0455, 0500…),
 * utom Stockholm som har två (08). Listan är komplett för de tresiffriga
 * svenska riktnumren — den behöver inte gissas, den är ändlig.
 */
const RIKTNR_3 = new Set([
  '011', '013', '016', '018', '019', '021', '023', '026', '031', '033',
  '035', '036', '040', '042', '044', '046', '054', '060', '063', '090',
])

/** Riktnummerdelens längd. 08 = 2, mobil 07x = 3, annars 3 eller 4. */
function riktnummerLangd(siffror: string): number {
  if (siffror.startsWith('08')) return 2
  if (siffror.startsWith('07')) return 3
  if (RIKTNR_3.has(siffror.slice(0, 3))) return 3
  return 4
}

/**
 * Mobilnummer (07x) är i praktiken en enskild styrelsemedlems privata telefon,
 * inte föreningens växel. Registret skiljer inte på dem, så prefixet är den
 * enda signal som finns. 600 av 29 412 rader träffas.
 *
 * Samma gränsdragning som utskickssegmenteringen gör på e-postsidan: en
 * funktionsuppgift tillhör den juridiska personen, ett personligt nummer inte.
 */
export function arMobilnummer(telefon: string | null | undefined): boolean {
  return /^07/.test((telefon ?? '').replace(/\D/g, ''))
}

/**
 * "086502712" → "08-650 27 12". Registret levererar rena siffror utan
 * separatorer (mätt: längd 8–11, alltid inledande 0).
 *
 * Abonnentnumret grupperas i par räknat från HÖGER; är antalet udda får den
 * vänstra gruppen tre siffror. Det är SIS-konventionen och den som gör
 * "08-650 27 12" av 086502712 i stället för "08-65 02 712".
 *
 * Nummer som inte ser ut som svenska fastnätsnummer returneras oförändrade —
 * hellre rå sträng än en påhittad gruppering.
 */
export function formateraTelefon(telefon: string | null | undefined): string {
  const rå = (telefon ?? '').trim()
  const siffror = rå.replace(/\D/g, '')
  if (!siffror.startsWith('0') || siffror.length < 8 || siffror.length > 11) return rå

  const rikt = siffror.slice(0, riktnummerLangd(siffror))
  const rest = siffror.slice(rikt.length)
  if (rest.length < 4) return rå

  const grupper: string[] = []
  let i = 0
  if (rest.length % 2 === 1) { grupper.push(rest.slice(0, 3)); i = 3 }
  for (; i < rest.length; i += 2) grupper.push(rest.slice(i, i + 2))

  return `${rikt}-${grupper.join(' ')}`
}
