import { createClient } from '@supabase/supabase-js'

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
  bolagsverket_data: {
    verksamhetsbeskrivning?: string
    postadress_detaljer?: { coAdress?: string; utdelningsadress?: string; postnummer?: string; postort?: string }
    adress_bv?: string
    sni_koder?: Array<{ kod?: string; klartext?: string }>
    registreringsdatum_bv?: string
    verksam?: string
    namn_bv?: string[]
  } | null
}

export async function getBRFBySlug(slug: string): Promise<BRF | null> {
  const { data, error } = await supabase
    .from('foretag')
    .select('*')
    .eq('slug', slug)
    .eq('juridisk_form', 'Bostadsrättsföreningar')
    .single()
  if (error) return null
  return data as BRF
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

export function parseBvData(brf: BRF): BRF['bolagsverket_data'] {
  if (!brf.bolagsverket_data) return null
  if (typeof brf.bolagsverket_data === 'string') {
    try { return JSON.parse(brf.bolagsverket_data) } catch { return null }
  }
  return brf.bolagsverket_data
}

export function extractForvaltare(brf: BRF): string | null {
  if (brf.forvaltare) return brf.forvaltare
  const bv = parseBvData(brf)
  const co = bv?.postadress_detaljer?.coAdress
  if (!co || typeof co !== 'string') return null
  const trimmed = co.trim()
  if (/^c\/o\s+[A-ZÅÄÖ][a-zåäö]+\s+[A-ZÅÄÖ]/i.test(trimmed)) return null
  return trimmed.replace(/^c\/o\s+/i, '').trim() || null
}

export async function getForvaltareList(minCount = 2): Promise<Forvaltare[]> {
  // Fetch all BRFs with bolagsverket_data to extract forvaltare from coAdress
  const allBrfs: BRF[] = []
  let offset = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('foretag')
      .select('orgnr,namn,slug,postort,bolagsverket_data')
      .eq('juridisk_form', 'Bostadsrättsföreningar')
      .not('bolagsverket_data', 'is', null)
      .range(offset, offset + batchSize - 1)
    if (error || !data || data.length === 0) break
    allBrfs.push(...(data as BRF[]))
    if (data.length < batchSize) break
    offset += batchSize
  }

  const counts: Record<string, number> = {}
  for (const brf of allBrfs) {
    const f = extractForvaltare(brf)
    if (f) counts[f] = (counts[f] || 0) + 1
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= minCount) // List view: 2+ BRFs; detail resolution: 1+ (avoid dead internlänkar)
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getBRFsByForvaltare(forvaltareName: string, limit = 500): Promise<BRF[]> {
  // Fetch BRFs and filter by forvaltare (from column or JSON)
  const allBrfs: BRF[] = []
  let offset = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('foretag')
      .select('*')
      .eq('juridisk_form', 'Bostadsrättsföreningar')
      .not('bolagsverket_data', 'is', null)
      .range(offset, offset + batchSize - 1)
    if (error || !data || data.length === 0) break
    allBrfs.push(...(data as BRF[]))
    if (data.length < batchSize) break
    offset += batchSize
  }

  return allBrfs
    .filter(brf => extractForvaltare(brf) === forvaltareName)
    .sort((a, b) => (b.rank_score ?? 0) - (a.rank_score ?? 0))
    .slice(0, limit)
}

export async function getForvaltareBySlug(slug: string): Promise<{ name: string; brfs: BRF[] } | null> {
  // minCount=1: a förvaltare-detalj kan nås via internlänk från en enskild BRF-sida
  // även om förvaltaren bara har 1 BRF. Annars blir varje sådan länk en 404.
  const list = await getForvaltareList(1)
  const match = list.find(f => f.slug === slug)
  if (!match) return null

  const brfs = await getBRFsByForvaltare(match.name)
  return { name: match.name, brfs }
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

export function formatOrgnr(o: string) {
  return o.length === 10 && !o.includes('-') ? `${o.slice(0, 6)}-${o.slice(6)}` : o
}
export function bildadAr(s: string | null) { return s ? s.slice(0, 4) : 'Okänt' }
export function avgift(brf: BRF) {
  if (!brf.rank_score) return '—'
  return `${600 + (brf.rank_score % 400)} kr/kvm`
}
export function initials(namn: string) {
  return namn.replace(/^(brf|bostadsrättsföreningen?)\s+/i, '')
    .split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
