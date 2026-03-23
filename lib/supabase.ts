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
    .eq('status', 'AKTIV')
    .order('rank_score', { ascending: false })
    .limit(limit)
  if (error) return []
  return data as BRF[]
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
