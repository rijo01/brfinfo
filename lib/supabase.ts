import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
export const supabase = createClient(supabaseUrl, supabaseKey)

export type BRF = {
  orgnr: string
  namn: string
  postort: string
  kommun: string
  lan: string
  bransch: string
  anstallda: number | null
  juridisk_form: string
  telefon: string | null
  email: string | null
  adress: string | null
  startdatum: string | null
  status: string | null
  rank_score: number | null
  hemsida: string | null
  infotext: string | null
  slug: string
  lat: number | null
  lng: number | null
  rating: number | null
  review_count: number | null
  featured: boolean | null
  verified: boolean | null
  forvaltare: string | null
  // Rå kolumn: innehåller numera Bolagsverkets svarskuvert ({ organisationer: [...] }),
  // historiskt den tillplattade BvFlat-formen, ibland som JSON-sträng. Läs den ALDRIG
  // direkt — gå via parseBvData(), som normaliserar alla tre till BvFlat.
  bolagsverket_data: unknown
}

// Den tillplattade formen som sidorna läser (parseBvData returnerar den).
export type BvFlat = {
  verksamhetsbeskrivning?: string
  postadress_detaljer?: { coAdress?: string; utdelningsadress?: string; postnummer?: string; postort?: string }
  adress_bv?: string
  sni_koder?: Array<{ kod?: string; klartext?: string }>
  registreringsdatum_bv?: string
  verksam?: string
  namn_bv?: string[]
}

// Slår upp EN BRF på slug.
//
// Skiljer "finns inte" (null) från "gick inte att svara på" (kastar). Tidigare
// användes .single(), vars error-gren träffar BÅDA fallen: en tillfällig
// DB-störning gav då samma null som en okänd slug → notFound() → en 404 som
// ISR cachade in och Google hann indexera. Verifierat i loggen: 24 av 27 loggade
// /brf-404:or (cache=MISS) svarar 200 vid direkt kontroll — sidorna fanns hela
// tiden. Ett kastat fel ger i stället 500: inte cachebart, och Google försöker
// igen i stället för att avindexera. Samma princip som harEnergiData() följer.
export async function getBRFBySlug(slug: string): Promise<BRF | null> {
  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .eq('slug', slug)
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .maybeSingle()
  if (error) throw new Error(`getBRFBySlug(${slug}) misslyckades: ${error.message}`)
  return (data as BRF | null) ?? null
}

// Slug-format: "<slugifierat namn>-<orgnr>" (orgnr = 10 siffror, osiffrat).
// Historiska slugar bär samma orgnr men en annan namndel, eller ett formaterat
// orgnr ("769643-2124"). Orgnr är därför nyckeln som binder gammal URL till ny.
// Returnerar null när slugen inte bär något orgnr alls (äldsta formatet).
export function orgnrFromSlug(slug: string): string | null {
  const m = slug.match(/(\d{6})-?(\d{4})$/)
  return m ? m[1] + m[2] : null
}

// Slår upp en förening på den ÄLDSTA slug-formen: bara det slugifierade namnet,
// utan orgnr-suffix ("bostadsrattsforeningen-bojen-i-kalmar"). Nuvarande slug är
// samma sträng plus "-<orgnr>", så den gamla URL:en är ett prefix av den nya.
//
// Kräver EXAKT en träff. 748 av ~28 700 namndelar delas av flera föreningar
// (t.ex. "bostadsrattsforeningen-algen"); där går det inte att veta vilken URL:en
// avsåg, så vi pekar inte om alls utan låter den 404:a. Hämtar två rader just för
// att kunna se skillnad på "unik" och "tvetydig".
//
// Slugar består bara av [a-z0-9-], så strängen kan inte bära LIKE-jokrar.
export async function getBRFByNamnprefix(namnslug: string): Promise<BRF | null> {
  if (!/^[a-z0-9-]+$/.test(namnslug)) return null
  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .like('slug', `${namnslug}-%`)
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .limit(2)
  if (error) throw new Error(`getBRFByNamnprefix(${namnslug}) misslyckades: ${error.message}`)
  const rader = (data as BRF[] | null) ?? []
  // Bara suffix som är ett rent orgnr räknas — annars matchar "…-algen" även
  // "…-algen-2-<orgnr>", en helt annan förening.
  const exakta = rader.filter(r => new RegExp(`^${namnslug}-\\d{10}$`).test(r.slug))
  return exakta.length === 1 ? exakta[0] : null
}

// Samma skillnad mellan "finns inte" och "gick inte att svara på" som ovan.
export async function getBRFByOrgnr(orgnr: string): Promise<BRF | null> {
  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .eq('orgnr', orgnr)
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .maybeSingle()
  if (error) throw new Error(`getBRFByOrgnr(${orgnr}) misslyckades: ${error.message}`)
  return (data as BRF | null) ?? null
}

export async function searchBRFs(query: string, limit = 30): Promise<BRF[]> {
  // Strip common prefixes to improve matching
  const stripped = query
    .replace(/^brf\s+/i, '')
    .replace(/^bostadsrättsföreningen?\s+/i, '')
    .trim()

  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .or(`namn.ilike.%${stripped}%,postort.ilike.%${stripped}%,adress.ilike.%${stripped}%`)
    .order('rank_score', { ascending: false })
    .limit(limit)
  if (error) return []
  return data as BRF[]
}

export async function getBRFsByCity(city: string, limit = 30): Promise<BRF[]> {
  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .ilike('postort', `%${city}%`)
    .order('rank_score', { ascending: false })
    .limit(limit)
  if (error) return []
  return data as BRF[]
}

// React-cache: generateMetadata och sidkomponenten renderas i SAMMA request och
// behöver båda antalet. Utan memoisering hade metadata-mallen dubblerat
// count-queryn per stad. Med den körs den en gång per request — noll nya queries.
export const getBRFCountByCity = cache(async function getBRFCountByCity(city: string): Promise<number | null> {
  // Same filter as getBRFsByCity so the count matches the listing shown on the page.
  const { count, error } = await supabase
    .from('foretag')
    .select('orgnr', { count: 'exact', head: true })
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .ilike('postort', `%${city}%`)
  if (error || count == null) return null
  return count
})

export async function getFeaturedBRFs(limit = 6): Promise<BRF[]> {
  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .eq('status', 'Är verksam')
    .order('rank_score', { ascending: false })
    .limit(limit)
  if (error) return []
  return data as BRF[]
}

export type Forvaltare = {
  name: string
  slug: string
  count: number
}

// Bolagsverkets råa svarskuvert ({ organisationer: [ ... ] }). Enrichern lagrar numera
// API-svaret oförändrat i foretag.bolagsverket_data; tidigare lagrades en tillplattad
// egen form. Typen nedan täcker bara de noder vi faktiskt läser.
type BvEnvelope = {
  organisationer?: Array<{
    verksamhetsbeskrivning?: { beskrivning?: string | null } | null
    postadressOrganisation?: {
      postadress?: {
        coAdress?: string | null
        utdelningsadress?: string | null
        postnummer?: string | null
        postort?: string | null
      } | null
    } | null
    naringsgrenOrganisation?: { sni?: Array<{ kod?: string; klartext?: string }> | null } | null
    organisationsdatum?: { registreringsdatum?: string | null } | null
    verksamOrganisation?: { kod?: string | null } | null
    organisationsnamn?: { organisationsnamnLista?: Array<{ namn?: string | null }> | null } | null
  }> | null
}

// Normaliserar Bolagsverkets kuvert till den tillplattade formen som sidorna läser.
//
// BAKGRUND (orsaken till ~1100 av 1241 loggade 404:or): enrichern bytte lagringsformat
// till Bolagsverkets råa svar, men läsarna letade kvar på de gamla nycklarna
// (bv.postadress_detaljer.coAdress m.fl.). Alla blev undefined för ALLA 29 407 rader →
// forvaltareFromCoAdress() returnerade null för varje BRF → förvaltarindexet blev tomt
// → /forvaltare visade "0 förvaltningsbolag" och HELA /forvaltare/<slug> 404:ade
// (inklusive hsb-stockholm, sbc, riksbyggen). Dessutom slutade c-o-→ren-redirecten
// nedan att avfyra, eftersom den kräver att målet resolvar.
//
// Båda formerna stöds: har objektet "organisationer" mappas det om, annars antas det
// redan vara den tillplattade formen (äldre rader).
function normalizeBvData(raw: unknown): BvFlat | null {
  if (!raw || typeof raw !== 'object') return null
  const env = raw as BvEnvelope
  if (!Array.isArray(env.organisationer)) return raw as BvFlat
  const o = env.organisationer[0]
  if (!o) return null

  const post = o.postadressOrganisation?.postadress ?? null
  // Tomma SNI-platshållare ("     " / "") filtreras bort — Bolagsverket fyller alltid
  // listan till fem poster oavsett hur många koder som faktiskt är satta.
  const sni = (o.naringsgrenOrganisation?.sni ?? [])
    .filter(s => (s?.kod ?? '').trim() !== '' && (s?.klartext ?? '').trim() !== '')
    .map(s => ({ kod: s.kod?.trim(), klartext: s.klartext?.trim() }))
  const namn = (o.organisationsnamn?.organisationsnamnLista ?? [])
    .map(n => n?.namn)
    .filter((n): n is string => Boolean(n))
  const adressBv = [post?.utdelningsadress, [post?.postnummer, post?.postort].filter(Boolean).join(' ')]
    .map(s => (s ?? '').trim())
    .filter(Boolean)
    .join(', ')

  return {
    verksamhetsbeskrivning: o.verksamhetsbeskrivning?.beskrivning?.trim() || undefined,
    postadress_detaljer: post
      ? {
          coAdress: post.coAdress ?? undefined,
          utdelningsadress: post.utdelningsadress ?? undefined,
          postnummer: post.postnummer ?? undefined,
          postort: post.postort ?? undefined,
        }
      : undefined,
    adress_bv: adressBv || undefined,
    sni_koder: sni.length ? sni : undefined,
    registreringsdatum_bv: o.organisationsdatum?.registreringsdatum ?? undefined,
    verksam: o.verksamOrganisation?.kod ?? undefined,
    namn_bv: namn.length ? namn : undefined,
  }
}

export function parseBvData(brf: BRF): BvFlat | null {
  if (!brf.bolagsverket_data) return null
  if (typeof brf.bolagsverket_data === 'string') {
    try { return normalizeBvData(JSON.parse(brf.bolagsverket_data)) } catch { return null }
  }
  return normalizeBvData(brf.bolagsverket_data)
}

// Härled förvaltare ENBART ur coAdress (filtrerar bort personnamn, strippar "c/o").
// Detta är den taxonomi som /forvaltare-listan och slug-universumet bygger på.
// Exporteras så att BRF-sidan kan länka via EXAKT samma härledning som resolvern
// (getForvaltareBySlug) — annars genereras c-o-slugar som routen inte kan resolva.
export function forvaltareFromCoAdress(brf: BRF): string | null {
  const bv = parseBvData(brf)
  const co = bv?.postadress_detaljer?.coAdress
  if (!co || typeof co !== 'string') return null
  const trimmed = co.trim()
  if (/^c\/o\s+[A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ]/i.test(trimmed)) return null
  return trimmed.replace(/^c\/o\s+/i, '').trim() || null
}

// Används av BRF-sidan: forvaltare-kolumnen först, annars coAdress. OFÖRÄNDRAD semantik.
export function extractForvaltare(brf: BRF): string | null {
  if (brf.forvaltare) return brf.forvaltare
  return forvaltareFromCoAdress(brf)
}

// ── Cachat förvaltar-index ───────────────────────────────────────────────────
// Förvaltare härleds coAdress-only (samma taxonomi som /forvaltare-listan haft).
// Att räkna det per request innebar TVÅ full-table-scans (en med select *, ~30 s)
// och tippade under crawler-last. Vi bygger i stället HELA mappen förvaltare→BRF
// med EN slimmad scan och cachar den i Next Data Cache.
//
// Storlek: kompakt array-kodning [orgnr,namn,slug,postort,adress], försorterad på
// rank_score → ~1,4 MB, väl under Next Data Cache:s 2 MB-gräns per post (så hela
// indexet får plats i EN cache-post → alla kalla slugar delar samma map).
//
// STRIKT READ-ONLY mot foretag: enda DB-anropet är .select(...). Ingen
// insert/update/upsert/delete/rpc. Källtabellen rörs aldrig.
export type SlimBRF = Pick<BRF, 'orgnr' | 'namn' | 'slug' | 'postort' | 'adress'>
type PackedBRF = [orgnr: string, namn: string, slug: string, postort: string, adress: string | null]
function unpack(r: PackedBRF): SlimBRF {
  return { orgnr: r[0], namn: r[1], slug: r[2], postort: r[3], adress: r[4] }
}

async function buildForvaltareIndex(): Promise<Record<string, PackedBRF[]>> {
  // Samla med rank_score för sortering; rank_score lagras INTE i cachen (sparar plats).
  const tmp: Record<string, Array<{ r: PackedBRF; rank: number }>> = {}
  let offset = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('foretag')
      .select('orgnr,namn,slug,postort,adress,rank_score,bolagsverket_data')
      .eq('juridisk_form', 'Bostadsrättsföreningar')
      .not('bolagsverket_data', 'is', null)
      .range(offset, offset + batchSize - 1)
    if (error || !data || data.length === 0) break
    for (const row of data as BRF[]) {
      const f = forvaltareFromCoAdress(row)
      if (!f) continue
      ;(tmp[f] ??= []).push({
        r: [row.orgnr, row.namn, row.slug, row.postort, row.adress],
        rank: row.rank_score ?? 0,
      })
    }
    if (data.length < batchSize) break
    offset += batchSize
  }
  // Försortera på rank_score desc (som detaljsidan förväntar) och släng rank_score.
  const index: Record<string, PackedBRF[]> = {}
  for (const name of Object.keys(tmp)) {
    index[name] = tmp[name].sort((a, b) => b.rank - a.rank).map(x => x.r)
  }
  return index
}

// Cachas i 24 h. Förvaltardata (Bolagsverket coAdress) ändras månadsvis → 24 h ger
// gott om färskhet utan korrekthetsproblem. Första kalla bygget per fönster kör
// scanningen EN gång; alla övriga requests — inkl. en crawler-storm över tusentals
// slugar — delar samma cachade map och blir millisekunder i stället för ~30 s.
const getForvaltareIndex = unstable_cache(
  buildForvaltareIndex,
  ['forvaltare-index-v1'],
  { revalidate: 86400, tags: ['forvaltare-index'] },
)

export async function getForvaltareList(minCount = 2): Promise<Forvaltare[]> {
  const index = await getForvaltareIndex()
  return Object.entries(index)
    .filter(([, brfs]) => brfs.length >= minCount) // Listvy: 2+ BRF; detalj-resolution: 1+ (undvik döda internlänkar)
    .map(([name, brfs]) => ({ name, slug: slugify(name), count: brfs.length }))
    .sort((a, b) => b.count - a.count)
}

// Behålls som publik export (tunn vy över det cachade indexet). Tidigare gjorde
// den en egen full-table-scan med select * — nu noll extra DB-anrop.
export async function getBRFsByForvaltare(forvaltareName: string, limit = 500): Promise<SlimBRF[]> {
  const index = await getForvaltareIndex()
  return (index[forvaltareName] ?? []).slice(0, limit).map(unpack)
}

export async function getForvaltareBySlug(slug: string): Promise<{ name: string; total: number; brfs: SlimBRF[] } | null> {
  // minCount=1: en förvaltar-detalj kan nås via internlänk från en enskild BRF-sida
  // även om förvaltaren bara har 1 BRF. Annars blir varje sådan länk en 404.
  const index = await getForvaltareIndex()
  // Sortera på antal desc så att en ev. slug-krock löses likadant som tidigare
  // (getForvaltareList sorterade på count desc och find() tog första = högsta).
  const match = Object.entries(index)
    .sort((a, b) => b[1].length - a[1].length)
    .find(([name]) => slugify(name) === slug)
  if (!match) return null
  // total = hela gruppens storlek; brfs kapas vid 500 för rendering. Sidan visar
  // "500 av <total>" när den kapas så räkningen inte motsäger listsidan.
  return { name: match[0], total: match[1].length, brfs: match[1].slice(0, 500).map(unpack) }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Display-only helpers (påverkar ENBART det som visas i listor) ─────────────
// Rör ALDRIG slug/URL/routing. Slugen byggs alltid ur det råa namnet via slugify()
// (som redan strippar snedstreck), så de här funktionerna kan aldrig ändra en URL.

// Städa visningsnamnet på en förvaltare: strippa ledande/avslutande snedstreck och
// blanksteg ("/HSB Stockholm/" → "HSB Stockholm"). slugify("/HSB Stockholm/") och
// slugify("HSB Stockholm") ger BÅDA "hsb-stockholm" → slugen är oförändrad.
export function displayForvaltareName(name: string): string {
  const cleaned = name.replace(/^[\s/]+|[\s/]+$/g, '').replace(/\s{2,}/g, ' ').trim()
  return cleaned || name
}

// Ren box-adress ("Box 203", "Box 843") utan gatunamn → dölj i listvyer. En riktig
// gatuadress ("Rehnsg. 15") matchar inte och visas fortsatt.
export function isBoxOnlyAddress(adress: string | null | undefined): boolean {
  if (!adress) return false
  return /^box\s*\d+\s*$/i.test(adress.trim())
}

export function formatOrgnr(o: string) {
  return o.length === 10 && !o.includes('-') ? `${o.slice(0, 6)}-${o.slice(6)}` : o
}
export function bildadAr(s: string | null) { return s ? s.slice(0, 4) : 'Okänt' }
export function initials(namn: string) {
  return namn.replace(/^(brf|bostadsrättsföreningen?)\s+/i, '')
    .split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
