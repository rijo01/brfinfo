import { supabase } from './supabase'

export type Energideklaration = {
  id: number
  orgnr: string
  fastighetsbeteckning: string | null
  kommun: string | null
  adress: string | null
  postnummer: string | null
  postort: string | null
  energiklass: string | null
  boverket_id: string | null
  primarenergital_kwh: number | null
  energiprestanda_kwh: number | null
  specifik_energianvandning_kwh: number | null
  byggnadsar: number | null
  radonmatning: string | null
  ventilationskontroll: string | null
  utford: string | null
  giltig_tom: string | null
  matchad: boolean
  match_metod: string | null
}

// Färg per energiklass (A bäst → G sämst). Matchar Boverkets skala visuellt.
const KLASS_FARG: Record<string, string> = {
  A0: '#1B7C6E', A: '#2E9E5B', B: '#7CB342', C: '#C0CA33',
  D: '#FDD835', E: '#FB8C00', F: '#F4511E', G: '#D32F2F',
}

export function energiklassFarg(klass: string | null | undefined): string {
  if (!klass) return '#6A8090'
  return KLASS_FARG[klass.toUpperCase()] ?? '#6A8090'
}

// Hämtar den senaste/giltiga matchade deklarationen för en BRF (kan finnas flera byggnader).
export async function getEnergiByOrgnr(orgnr: string): Promise<Energideklaration | null> {
  try {
    const { data, error } = await supabase
      .from('energideklarationer')
      .select('*')
      .eq('orgnr', orgnr)
      .eq('matchad', true)
      .order('utford', { ascending: false, nullsFirst: false })
      .limit(1)
    if (error || !data || data.length === 0) return null
    return data[0] as Energideklaration
  } catch {
    return null
  }
}

export type EnergiKatalogPost = {
  orgnr: string
  namn: string
  slug: string
  adress: string | null
  energiklass: string | null
  primarenergital_kwh: number | null
}

// Hämtar BRF:er i en kommun som har en matchad energideklaration (för katalog-sidan).
// Joinar mot foretag för namn/slug.
export async function getEnergiByKommun(kommun: string, limit = 300): Promise<EnergiKatalogPost[]> {
  try {
    const { data: decls, error } = await supabase
      .from('energideklarationer')
      .select('orgnr,energiklass,primarenergital_kwh,adress')
      .eq('kommun', kommun)
      .eq('matchad', true)
      .limit(limit)
    if (error || !decls || decls.length === 0) return []

    // Dedupe per orgnr (behåll första), hämta namn/slug från foretag.
    const byOrgnr: Record<string, any> = {}
    for (const d of decls) if (!byOrgnr[d.orgnr]) byOrgnr[d.orgnr] = d
    const orgnrs = Object.keys(byOrgnr)

    const { data: brfs } = await supabase
      .from('foretag')
      .select('orgnr,namn,slug')
      .in('orgnr', orgnrs)

    const brfMap: Record<string, any> = {}
    for (const b of (brfs ?? []) as any[]) brfMap[b.orgnr] = b

    const out: EnergiKatalogPost[] = []
    for (const orgnr of orgnrs) {
      const d = byOrgnr[orgnr]
      const b = brfMap[orgnr]
      if (!b) continue
      out.push({
        orgnr,
        namn: b.namn,
        slug: b.slug,
        adress: d.adress,
        energiklass: d.energiklass,
        primarenergital_kwh: d.primarenergital_kwh,
      })
    }
    // Sortera A→G, sen null sist.
    const ORD = ['A0','A','B','C','D','E','F','G']
    out.sort((a, b) => {
      const ia = a.energiklass ? ORD.indexOf(a.energiklass.toUpperCase()) : 99
      const ib = b.energiklass ? ORD.indexOf(b.energiklass.toUpperCase()) : 99
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    return out
  } catch {
    return []
  }
}

export function fmtKwh(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toLocaleString('sv-SE')} kWh/m²·år`
}

export function fmtDatum(d: string | null | undefined): string {
  if (!d) return '—'
  return d.slice(0, 10)
}
