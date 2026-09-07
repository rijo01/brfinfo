// GOLDEN TEST — falska 404:or får aldrig uppstå igen.
//
// Bakgrunden: getBRFBySlug använde .single(), vars error-gren träffar BÅDA
// "noll rader" och "frågan gick inte att köra". Sidan tolkade null som
// "föreningen finns inte" och svarade 404 — en 404 som ISR cachar in och Google
// indexerar. I produktionsloggen svarade 24 av 27 loggade /brf-404:or (cache=MISS)
// 200 vid direkt kontroll: sidorna fanns hela tiden, det var databasen som
// hostade till i just det ögonblicket.
//
// Kontraktet som testas: ett DB-fel MÅSTE kasta (→ 500, ej cachebart, Google
// försöker igen). Bara ett bekräftat tomt svar får bli null (→ 404).

import { describe, it, expect, vi, beforeEach } from 'vitest'

// En kedjebar stubb av PostgREST-byggaren. Varje metod returnerar sig själv;
// den avslutande maybeSingle()/limit() ger det svar testet har riggat.
let svar: { data: unknown; error: unknown } = { data: null, error: null }

vi.mock('@supabase/supabase-js', () => {
  const b: Record<string, unknown> = {}
  for (const m of ['from', 'select', 'eq', 'like', 'not', 'order', 'range']) b[m] = () => b
  b.maybeSingle = async () => svar
  b.limit = async () => svar
  return { createClient: () => b }
})
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
// React.cache är per-request-memoisering i Next; i test räcker identiteten.
vi.mock('react', async () => ({ ...(await vi.importActual<object>('react')), cache: (fn: unknown) => fn }))

import { getBRFBySlug, getBRFByOrgnr, orgnrFromSlug, parseBvData } from '../supabase'

beforeEach(() => { svar = { data: null, error: null } })

describe('getBRFBySlug skiljer "finns inte" från "gick inte att svara på"', () => {
  it('KASTAR vid DB-fel — får ALDRIG bli en cachebar 404', async () => {
    svar = { data: null, error: { message: 'canceling statement due to statement timeout' } }
    await expect(getBRFBySlug('bostadsrattsforeningen-albrekt-7696011068')).rejects.toThrow(/misslyckades/)
  })

  it('kastar även när felet ser tomt ut (nätverksavbrott utan message)', async () => {
    svar = { data: null, error: { message: '' } }
    await expect(getBRFBySlug('vad-som-helst-7696011068')).rejects.toThrow()
  })

  it('ger null bara vid bekräftat tomt svar — då är 404 rätt', async () => {
    svar = { data: null, error: null }
    await expect(getBRFBySlug('finns-inte-0000000000')).resolves.toBeNull()
  })

  it('ger raden när den finns', async () => {
    svar = { data: { orgnr: '7696011068', slug: 'x-7696011068' }, error: null }
    await expect(getBRFBySlug('x-7696011068')).resolves.toMatchObject({ orgnr: '7696011068' })
  })

  it('samma kontrakt gäller redirect-uppslaget på orgnr', async () => {
    svar = { data: null, error: { message: 'connection reset' } }
    await expect(getBRFByOrgnr('7696011068')).rejects.toThrow(/misslyckades/)
  })
})

describe('orgnrFromSlug — nyckeln som binder gammal URL till ny', () => {
  it.each([
    ['bostadsrattsforeningen-albrekt-7696011068', '7696011068'],
    ['transformatorn-10-lidingo-769623-9453', '7696239453'],  // formaterat orgnr
    ['7940000180', '7940000180'],                              // bara orgnr
    ['bostadsrattsforeningen-bojen-i-kalmar', null],           // äldsta formen
    ['bostadsrattsforeningen-lyran-737600019', null],          // 9 siffror = inget orgnr
  ])('%s → %s', (slug, forvantat) => {
    expect(orgnrFromSlug(slug)).toBe(forvantat)
  })
})

describe('parseBvData — formatkontraktet mot Bolagsverket', () => {
  const kuvert = {
    organisationer: [{
      verksamhetsbeskrivning: { beskrivning: '  Föreningen förvaltar huset.  ' },
      postadressOrganisation: { postadress: { coAdress: 'Riksbyggen', utdelningsadress: 'Box 149', postnummer: '78122', postort: 'BORLÄNGE' } },
      naringsgrenOrganisation: { sni: [{ kod: '68204', klartext: 'Förvaltning i bostadsrättsföreningar' }, { kod: '     ', klartext: '' }] },
      organisationsdatum: { registreringsdatum: '1955-05-26' },
      verksamOrganisation: { kod: 'JA' },
      organisationsnamn: { organisationsnamnLista: [{ namn: 'Bostadsrättsföreningen Abeckshyttan' }] },
    }],
  }

  it('plattar ut kuvertet — det format som faktiskt ligger i kolumnen i dag', () => {
    const f = parseBvData({ bolagsverket_data: kuvert } as never)
    expect(f?.postadress_detaljer?.coAdress).toBe('Riksbyggen')
    expect(f?.verksamhetsbeskrivning).toBe('Föreningen förvaltar huset.')
    expect(f?.adress_bv).toBe('Box 149, 78122 BORLÄNGE')
    expect(f?.registreringsdatum_bv).toBe('1955-05-26')
    expect(f?.namn_bv).toEqual(['Bostadsrättsföreningen Abeckshyttan'])
  })

  it('filtrerar Bolagsverkets tomma SNI-platshållare', () => {
    expect(parseBvData({ bolagsverket_data: kuvert } as never)?.sni_koder).toEqual([
      { kod: '68204', klartext: 'Förvaltning i bostadsrättsföreningar' },
    ])
  })

  it('läser fortfarande den gamla platta formen (äldre rader)', () => {
    const platt = { postadress_detaljer: { coAdress: 'HSB Stockholm' } }
    expect(parseBvData({ bolagsverket_data: platt } as never)?.postadress_detaljer?.coAdress).toBe('HSB Stockholm')
  })

  it('klarar JSON-sträng och null utan att kasta', () => {
    expect(parseBvData({ bolagsverket_data: JSON.stringify(kuvert) } as never)?.postadress_detaljer?.coAdress).toBe('Riksbyggen')
    expect(parseBvData({ bolagsverket_data: null } as never)).toBeNull()
    expect(parseBvData({ bolagsverket_data: '{trasig' } as never)).toBeNull()
  })
})
