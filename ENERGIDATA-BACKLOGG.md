# Backlogg: energidata från Boverket

**Status 2026-09-07: BYGG INGET.** Posten är en utredning, inte ett åtagande.
Tabellen `energideklarationer` innehåller **0 rader** (verifierat mot produktions-
databasen), varav 0 matchade. Hela `/energiklass/*`-funktionen står därför utan
data. Så länge det gäller:

- `/energiklass/<stad>` för de fyra kuraterade städerna 301:as till
  `/energideklaration` (`next.config.js`).
- Routen sätter `noindex, follow` datadrivet — villkoret lyfts av sig självt den
  dag `harEnergiData()` svarar `true`, ingen behöver komma ihåg det.
- `app/sitemap.ts` filtrerar bort städer som ligger under redirect.

## Går registret att hämta lagligt?

Ja, men inte som öppna data — det kräver avtal.

- Boverket har ett **publikt API för energideklarationer**. Det är **gratis** men
  förutsätter ett **påskrivet användaravtal**: signering via Addo Sign med BankID,
  och undertecknaren måste vara firmatecknare. Boverket kontaktar därefter utsedd
  integratör med åtkomstuppgifter.
- API:et lämnar bara **"grunddata"**. Boverket anger uttryckligen att lag och
  förordning begränsar vilka uppgifter som får delas — hela deklarationen finns
  alltså inte att hämta.
- Boverket har en särskild sida om **personuppgiftsbehandling** för tjänsten.

**EJ VERIFIERAT — måste läsas före något bygge:** de exakta klausulerna om
vidarepublicering, lagring/cachning, källhänvisning och personuppgiftsansvar.
Boverkets sidor renderas med JavaScript och gick inte att läsa maskinellt i den
här omgången; användaravtalets PDF svarade 404 på den länk sökmotorn gav.
Villkoren avgör om vi över huvud taget får visa uppgifterna på BRF-sidorna —
utred det FÖRST, innan en rad kod skrivs.

## Går det tekniskt?

Ja, men matchningen är det svåra — inte hämtningen.

| Begränsning | Värde |
|---|---|
| Anrop | 10 per 2 sekunder |
| Anrop per dygn | **1 500** |
| Data per dygn | 40 000 kB |
| Sökbegrepp | **fastighetsbeteckning ELLER adress** |
| Otillgängligt | dagligen 06:00–06:15 (databasuppdatering) |

Två hårda hinder följer av tabellen:

1. **Nyckeln matchar inte vår.** Hela BRFinfo är byggt på orgnr. Boverket känner
   inte till orgnr — bara byggnad, fastighetsbeteckning och adress. Vi har ingen
   fastighetsbeteckning för någon av de 29 429 föreningarna. Kvar blir
   adressmatchning mot `foretag.adress`, som ofta är en boxadress eller
   förvaltarens kontor snarare än husets gatuadress. Det är precis den
   matchningen som redan misslyckats: kolumnen `matchad` finns i schemat men
   ingen rad har någonsin fyllts i.
2. **Volymen tar veckor.** 1 500 anrop per dygn mot 29 429 föreningar ger minst
   **20 dygns** oavbruten hämtning för ETT svep — och då räknat som en adress per
   förening. En BRF äger i praktiken flera byggnader med var sin deklaration, så
   det verkliga talet är högre. Registret ska dessutom uppdateras löpande.

Slutsatsen är inte "omöjligt" utan "en egen produkt". Det är ett
adressnormaliserings- och matchningsprojekt med veckolånga körningar, inte en
enricher man skriver på en eftermiddag.

## Utlösare — när posten ska tas upp igen

Ta upp den när MINST en av dessa inträffar:

1. **Avtalet är påskrivet och villkoren lästa** — särskilt att vi får
   vidarepublicera grunddata på brfinfo.se med källhänvisning. Utan det: lägg ner.
2. **Vi har en fastighetsbeteckning per BRF** från annan källa (t.ex. Lantmäteriet
   eller Bolagsverkets fastighetsuppgifter). Då blir matchningen ett uppslag i
   stället för en gissning, och hela hinder 1 faller.
3. **Energidata efterfrågas mätbart** — energi-CTA:n på BRF-sidan
   (`energi_cta_click`) visar reell efterfrågan, eller söktrafiken på
   "energiklass brf <stad>" motiverar arbetet.
4. **Boverket öppnar bulkuttag.** Faller dygnstaket på 1 500 anrop bort ändras
   kalkylen helt.

## Om posten öppnas: gör i den här ordningen

1. Läs användaravtalet. Skriv ned vad som får publiceras — i den här filen.
2. Ta 200 BRF:er med kända gatuadresser som pilot. Mät träffprocenten i
   adressmatchningen INNAN något svep startas.
3. Under 60 % träff → bygg inte vidare, lös fastighetsbeteckningen först.
4. Först därefter: enricher med respekt för 1 500/dygn, återupptagbar
   paginering och `matchad`/`match_metod` ifyllt så resultatet går att granska.

Källor:
- <https://www.boverket.se/sv/om-boverket/oppna-data/publikt-api-for-energideklarationer/>
- <https://www.boverket.se/sv/om-boverket/oppna-data/publikt-api-for-energideklarationer/sa-fungerar-api-for-energideklarationer/>
- <https://www.boverket.se/sv/om-boverket/oppna-data/publikt-api-for-energideklarationer/personuppgiftsbehandling-api-energideklarationer/>
