// Avsändaren bakom BRFinfo.se. Ett enda ställe — footern och /om läser härifrån
// så att uppgifterna inte kan hamna i otakt.

export const BOLAG: { namn: string; orgnr: string; epost: string } = {
  namn: 'Skiffer Group AB',
  // TODO: fyll i organisationsnumret. Fältet renderas inte medan det är tomt —
  // ett påhittat org.nr på en sajt som säljer registerdata vore värre än inget.
  orgnr: '',
  epost: 'info@brfinfo.se',
}
