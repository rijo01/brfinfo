import { unstable_cache } from 'next/cache'
import { supabase } from './supabase'

/**
 * Verifierade föreningshemsidor och publika årsredovisningssidor (brf_webb).
 *
 * Sajten läser med anon-nyckeln. `brf_webb` har GRANT på KOLUMNNIVÅ — anon får
 * bara de sex fälten nedan. Ett `select('*')` här ger `permission denied for
 * table brf_webb`, så kolumnlistan är inte en optimering utan ett krav.
 * RLS begränsar dessutom raderna till status 'ok'/'redirect'.
 */
export type BrfWebb = {
  orgnr: string
  hemsida_url: string | null
  hemsida_status: string | null
  hemsida_verifierad_at: string | null
  arsredovisning_url: string | null
  arsredovisning_hittad_at: string | null
}

const PUBLIKA_FALT =
  'orgnr,hemsida_url,hemsida_status,hemsida_verifierad_at,arsredovisning_url,arsredovisning_hittad_at'

/**
 * Hela den publika delen av brf_webb i EN post i Next Data Cache.
 *
 * Alternativet — en query per BRF-sidvisning — hade lagt ett extra anrop på
 * varje sidladdning mot en instans som redan ligger nära disk-IO-taket. Tabellen
 * är i stället några tusen rader × sex korta fält (~0,4 MB vid full utrullning),
 * långt under Data Cache:s 2 MB per post, så hela indexet ryms i en post och
 * alla sidor delar den.
 *
 * Nyckeln versioneras. Bumpa `-vN` när en ny batch landat, annars kan en sida
 * visa "ingen hemsida" i upp till en timme efter att raden skrivits.
 */
async function byggWebbIndex(): Promise<Record<string, BrfWebb>> {
  const index: Record<string, BrfWebb> = {}
  let offset = 0
  const batch = 1000
  while (true) {
    const { data, error } = await supabase
      .from('brf_webb')
      .select(PUBLIKA_FALT)
      .in('hemsida_status', ['ok', 'redirect'])
      .range(offset, offset + batch - 1)
    // Tabellen kanske inte finns ännu (SQL-blocket inte kört) eller så ligger
    // databasen nere. Båda ska ge en tom map, aldrig ett kastat fel: utan data
    // ska BRF-sidan rendera exakt som innan, inte krascha.
    if (error || !data || data.length === 0) break
    for (const rad of data as unknown as BrfWebb[]) index[rad.orgnr] = rad
    if (data.length < batch) break
    offset += batch
  }
  return index
}

// v2: bumpad 2026-09-02 när bulkkörningen landade. Utan bumpen hade en sida
// kunnat visa "ingen hemsida" i upp till en timme efter att raden skrevs.
const getWebbIndex = unstable_cache(byggWebbIndex, ['brf-webb-index-v2'], {
  revalidate: 3600,
  tags: ['brf-webb'],
})

export async function getWebbByOrgnr(orgnr: string): Promise<BrfWebb | null> {
  try {
    const index = await getWebbIndex()
    return index[orgnr] ?? null
  } catch {
    return null
  }
}

/** "12 augusti 2026" — datumet visas intill länken så besökaren ser hur färsk kontrollen är. */
export function formateraVerifierad(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
}
