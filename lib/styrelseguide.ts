// Katalog över styrelseguidens tre paket. Delas av /api/verify-session och /api/download.
// tier hämtas ALLTID från Stripe-sessionens metadata (aldrig klient-input) → ingen path traversal:
// download-routen slår upp filnamnet här via getPaket() utifrån sessionens metadata.tier.

export type Tier = 'paket1' | 'paket2' | 'paket3'

export type PaketInfo = {
  tier: Tier
  namn: string
  // Filnamn i content/styrelseguide-pdf/ (serverside, utanför public/).
  pdf: string
}

// OBS leverans: alla tre paket pekar tills vidare på samma handboks-PDF.
// TODO komplettera senare:
//  - paket2 ska dessutom leverera mallpaketet (15 mallar) som separata filer.
//  - paket3 inkluderar paket2 + 60 min personlig genomgång (bokning, ingen extra fil).
// När de leveranserna finns: lägg till fält/filer här och utöka download-routen.
const PAKET: Record<Tier, PaketInfo> = {
  paket1: { tier: 'paket1', namn: 'Den välskötta bostadsrättsföreningen — Handboken', pdf: 'handboken.pdf' },
  paket2: { tier: 'paket2', namn: 'Den välskötta bostadsrättsföreningen — Handboken + Mallpaket', pdf: 'handboken.pdf' },
  paket3: { tier: 'paket3', namn: 'Den välskötta bostadsrättsföreningen — Styrelsepaketet', pdf: 'handboken.pdf' },
}

export function getPaket(tier: unknown): PaketInfo | undefined {
  if (typeof tier === 'string' && Object.prototype.hasOwnProperty.call(PAKET, tier)) {
    return PAKET[tier as Tier]
  }
  return undefined
}
