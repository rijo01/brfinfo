// Avsändaren bakom BRFinfo.se. Ett enda ställe — footern och /om läser härifrån
// så att uppgifterna inte kan hamna i otakt.

export const BOLAG: { namn: string; orgnr: string; epost: string } = {
  namn: 'Skiffer Group AB',
  // TODO: fyll i organisationsnumret. Fältet renderas inte medan det är tomt —
  // ett påhittat org.nr på en sajt som säljer registerdata vore värre än inget.
  //
  // Uppslag 2026-09-07: "Skiffer Group AB" finns INTE i vår Supabase — noll
  // träffar i foretag (1 512 330 rader), companies_ab och fk_companies. Numret
  // gissas därför inte fram; det fylls i när det är belagt mot primärkälla.
  // Se DECISIONS.md BD-2. Fältet konsumeras av /om, sidfoten och seller-noden
  // i Product-schemat på /styrelseguide — alla tre tål tomt värde.
  orgnr: '',
  epost: 'info@brfinfo.se',
}
