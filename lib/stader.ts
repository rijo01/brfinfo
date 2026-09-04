// Kuraterade städer för /stad/[city]. Bor i lib/ och inte i routen eftersom en
// Next-page bara får exportera sina egna reserverade namn — och för att sitemap.ts
// ska kunna lista EXAKT de städer routen svarar 200 på. Listan låg tidigare
// hårdkodad en gång till i sitemap.ts; en stad som lades till eller togs bort på
// ett ställe men inte det andra gav antingen en osynlig sida eller en 404 i
// sitemapen.
export const META: Record<string, { name: string; desc: string; areas: string[] }> = {
  stockholm: { name: 'Stockholm', desc: 'Hitta alla BRF:er i Stockholm med org.nr, adress och kontaktuppgifter.', areas: ['Södermalm', 'Östermalm', 'Vasastan', 'Kungsholmen', 'Lidingö', 'Nacka', 'Solna', 'Sundbyberg'] },
  goteborg: { name: 'Göteborg', desc: 'BRF:er i Göteborg — hitta org.nr, adress och kontaktuppgifter.', areas: ['Hisingen', 'Majorna', 'Linnéstaden', 'Centrum', 'Örgryte', 'Angered', 'Askim', 'Mölndal'] },
  malmo: { name: 'Malmö', desc: 'Sök bland BRF:er i Malmö med org.nr, adress och kontakt.', areas: ['Möllevången', 'Limhamn', 'Husie', 'Centrum', 'Hyllie', 'Rosengård', 'Oxie', 'Kirseberg'] },
  uppsala: { name: 'Uppsala', desc: 'BRF:er i Uppsala med komplett registerinfo.', areas: ['Fålhagen', 'Luthagen', 'Kungsängen', 'Centrum', 'Eriksberg', 'Gottsunda', 'Sävja', 'Bälinge'] },
  linkoping: { name: 'Linköping', desc: 'Sök BRF:er i Linköping med org.nr, adress och bildandeår.', areas: ['Centrum', 'Ryd', 'Ekholmen', 'Lambohov', 'Gottfridsberg', 'Skäggetorp', 'Åby', 'Vikingstad'] },
  orebro: { name: 'Örebro', desc: 'Hitta BRF:er i Örebro med org.nr, adress och kontakt.', areas: ['Centrum', 'Brickebacken', 'Varberga', 'Adolfsberg', 'Mellringe', 'Hovsta', 'Längbro', 'Sörbyängen'] },
  vasteras: { name: 'Västerås', desc: 'BRF:er i Västerås med org.nr, adress och kontaktuppgifter.', areas: ['Centrum', 'Hamre', 'Skallberget', 'Viksäng', 'Bäckby', 'Rönnby', 'Tillberga', 'Irsta'] },
  helsingborg: { name: 'Helsingborg', desc: 'BRF:er i Helsingborg med org.nr, adress och bildandeår.', areas: ['Centrum', 'Drottninghög', 'Fredriksdal', 'Olympia', 'Råå', 'Rydebäck', 'Mörarp', 'Allerum'] },
  norrkoping: { name: 'Norrköping', desc: 'Sök BRF:er i Norrköping med org.nr, adress och bildandeår.', areas: ['Centrum', 'Ljura', 'Hageby', 'Vilbergen', 'Navestad', 'Åby', 'Kvillinge', 'Kimstad'] },
  jonkoping: { name: 'Jönköping', desc: 'BRF:er i Jönköping — register med org.nr, adress och bildandeår.', areas: ['Centrum', 'Huskvarna', 'Råslätt', 'Österängen', 'Barnarp', 'Sandseryd', 'Norrahammar', 'Bankeryd'] },
  gavle: { name: 'Gävle', desc: 'Hitta BRF:er i Gävle med org.nr, adress och kontaktuppgifter.', areas: ['Centrum', 'Bomhus', 'Sätra', 'Stigslund', 'Hemlingby', 'Strömsbro', 'Hille', 'Valbo'] },
  boras: { name: 'Borås', desc: 'BRF:er i Borås — hitta org.nr, adress och kontaktuppgifter.', areas: ['Centrum', 'Hässleholmen', 'Norrby', 'Göta', 'Brämhult', 'Sandared', 'Dalsjöfors', 'Fristad'] },
  eskilstuna: { name: 'Eskilstuna', desc: 'Sök bland BRF:er i Eskilstuna med org.nr, adress och bildandeår.', areas: ['Centrum', 'Fröslunda', 'Skiftinge', 'Råbergstorp', 'Hageby', 'Lagersberg', 'Torshälla', 'Kjula'] },
  karlstad: { name: 'Karlstad', desc: 'Hitta BRF:er i Karlstad vid Klarälven. Register med org.nr, adress och kontaktuppgifter.', areas: ['Centrum', 'Norrstrand', 'Sydöstra', 'Färjestad', 'Kronoparken', 'Rud', 'Viken', 'Grums'] },
  lulea: { name: 'Luleå', desc: 'BRF:er i Luleå – org.nr, adress och kontaktuppgifter i Norrbotten.', areas: ['Centrum', 'Björkskatan', 'Bergnäset', 'Råneå', 'Gammelstad', 'Hertsön', 'Kronan', 'Porsön'] },
  sundsvall: { name: 'Sundsvall', desc: 'Hitta BRF:er i Sundsvall med org.nr, adress och kontaktuppgifter i Medelpads residensstad.', areas: ['Centrum', 'Sidsjö', 'Norrmalm', 'Bosvedjan', 'Kovland', 'Timrå', 'Skönsmon', 'Alnö'] },
  trollhattan: { name: 'Trollhättan', desc: 'Sök BRF:er i Trollhättan med org.nr och adress i Västra Götaland.', areas: ['Centrum', 'Lextorp', 'Sjuntorp', 'Eriksborg', 'Vänersborg', 'Väne-Ryr', 'Väne-Åsaka', 'Frändefors'] },
  halmstad: { name: 'Halmstad', desc: 'Hitta BRF:er i Halmstad med org.nr, adress och kontakt i Hallands residensstad.', areas: ['Centrum', 'Söder', 'Frennarp', 'Oskarström', 'Harplinge', 'Getinge', 'Simlångsdalen', 'Kvibille'] },
  ostersund: { name: 'Östersund', desc: 'Hitta BRF:er i Östersund med org.nr och adress vid Storsjön.', areas: ['Centrum', 'Odenslund', 'Hornsberg', 'Lugnvik', 'Fältjägaren', 'Odensala', 'Lit', 'Brunflo'] },
  falun: { name: 'Falun', desc: 'BRF:er i Falun i Dalarnas residensstad. Org.nr, adress och kontaktuppgifter.', areas: ['Centrum', 'Hälsinggården', 'Hosjö', 'Kvarnsveden', 'Grycksbo', 'Vika', 'Järna', 'Enviken'] },
  vaxjo: { name: 'Växjö', desc: 'Sök bland BRF:er i Växjö med org.nr, adress och bildandeår i Kronoberg.', areas: ['Centrum', 'Araby', 'Dalbo', 'Öjaby', 'Toftaholm', 'Lammhult', 'Braås', 'Rottne'] },
  umea: { name: 'Umeå', desc: 'Hitta BRF:er i Umeå med komplett registerdata.', areas: ['Centrum', 'Ålidhem', 'Haga', 'Mariehem', 'Tomtebo', 'Carlshem', 'Teg', 'Ersboda'] },
  lund: { name: 'Lund', desc: 'BRF:er i Lund med org.nr, adress och kontaktuppgifter.', areas: ['Centrum', 'Norra Fäladen', 'Klostergården', 'Kobjer', 'Linero', 'Väster', 'Brunnshög', 'Stångby'] },
  borlange: { name: 'Borlänge', desc: 'Hitta BRF:er i Borlänge med org.nr och adress i Dalarnas industristad.', areas: ['Centrum', 'Tjärna Ängar', 'Jakobsgårdarna', 'Kvarnsveden', 'Hagalund', 'Vad', 'Smedjebacken', 'Stora Tuna'] },
  sodertalje: { name: 'Södertälje', desc: 'Sök BRF:er i Södertälje med org.nr, adress och bildandeår i Stockholms grannstad.', areas: ['Centrum', 'Ronna', 'Fornhöjden', 'Geneta', 'Hovsö', 'Pershagen', 'Järna', 'Enhörna'] },
  kalmar: { name: 'Kalmar', desc: 'Hitta BRF:er i Kalmar vid Kalmarsund i Smålands historiska residensstad.', areas: ['Centrum', 'Oxhagen', 'Norrliden', 'Söder', 'Berga', 'Fredriksskans', 'Ljungbyholm', 'Trekanten'] },
}
