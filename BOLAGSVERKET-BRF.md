# Bolagsverkets BRF-årsredovisningar — utredning

**Datum:** 2026-09-02 · **Status:** utredning, inget byggt · **Beslut krävs innan pilot**

## Kort svar

**Det finns ingen laglig gratiskanal för BRF-årsredovisningar, och kommer inte att finnas
under 2026–2027.** Ekonomiska föreningar lämnar in på *papper*. Bolagsverkets avgiftsfria
iXBRL-flöde — det som foretagskoll använder — omfattar **enbart aktiebolag**. BRF-materialet
finns bara som inskannad PDF, styckvis, mot avgift, under villkor som uttryckligen förbjuder
den bulkanvändning vi skulle behöva.

Läget är alltså inte "Boverket-problemet igen" (avtal som förbjuder spridning) utan värre:
**källan existerar inte i maskinläsbar form.**

---

## 1. Villkor och kanal

### Den fria kanalen: värdefulla datamängder

Bolagsverkets och SCB:s *värdefulla datamängder* är avgiftsfria sedan 2025-02-03 enligt
EU:s öppna data-direktiv. Villkoren är så generösa de kan bli:

> "Värdefulla datamängder ger dig tillgång till data som hämtas från oss på Bolagsverket.
> Du kan själv ladda ner våra filer för att få tillgång till datat. **Det kostar ingenting
> och det krävs inga avtal.** Våra filer uppdateras veckovis."
> — [Nedladdningsbara filer](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/nedladdningsbarafiler.2517.html)

> "Du får använda dessa data fritt för kommersiella och icke-kommersiella syften, exempelvis
> för att skapa nya tjänster eller produkter, så länge användningen inte bryter mot lagar om
> skydd av personuppgifter eller sekretess."
> — [Värdefulla datamängder](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html)

**Men avgränsningen dödar affären.** Samma sida, direkt efter:

> "I de värdefulla datamängderna ingår dokument i form av digitalt inlämnade årsredovisningar.
> Det finns idag inget tvång för bolag att lämna in årsredovisningen digitalt men Bolagsverket
> stödjer digital inlämning av **aktiebolags** års- och koncernredovisning enligt regelverken
> nedan och det är dessa du får tillgång till att hämta:
> – årsredovisning för aktiebolag enligt K2
> – årsredovisning för aktiebolag enligt K3
> – koncernredovisning för aktiebolag enligt K3
> – årsredovisning och koncernredovisning upprättade i enlighet med ESMAs ESEF-taxonomi."

Ingen ekonomisk förening. Ingen bostadsrättsförening.

### Varför: BRF lämnar in på papper

> "Från och med det räkenskapsår som inleds 2025-01-01 eller senare är ekonomiska föreningar
> skyldiga att skicka in årsredovisningen och revisionsberättelsen till Bolagsverket. […]
> **Skicka en årsredovisning på papper till: Bolagsverket 851 81 Sundsvall**"
> — [Årsredovisning för ekonomisk förening](https://bolagsverket.se/foretag/forening/ekonomiskforening/arsredovisningforekonomiskforening.1405.html) (uppdaterad 2026-01-23)

Och nyhet publicerad **2026-08-28**, fem dagar före denna utredning:

> "Ekonomiska föreningar skickar sina årsredovisningar till Bolagsverket på papper.
> **Det gäller även för räkenskapsåret 2026**, det vill säga för årsredovisningar som lämnas
> in under 2027. […] Vi arbetar för att även ekonomiska föreningar ska kunna skicka in sina
> årsredovisningar digitalt. En lösning kan bli att bostadsrättsföreningar blir först ut
> eftersom de är flest till antalet. **Något datum för när det blir möjligt har vi inte i
> dagsläget.**"
> — [Nyhet 2026-08-28](https://bolagsverket.se/omoss/nyheter/nyhetsarkiv/nyhetsarkiv2026/nyhetsarkiv2026/ekonomiskaforeningarskafortsattaattlamnainarsredovisningenpapapper.6083.html)

### Den avgiftsbelagda kanalen och dess villkor

Två vägar till pappersmaterialet, båda mot betalning:

**a) E-tjänsten Sök företagsinformation** — 75 kr per årsredovisning, kort/Swish, ingen
inloggning. Villkoren (ändrade 2025-04-28) innehåller den för oss avgörande klausulen:

> "**Du får endast lagra information från e-tjänsten i en begränsad omfattning och för din
> egen eller yrkesmässiga användning. Du får bara vidareförmedla information från e-tjänsten
> om det gäller en begränsad mängd information.**"
> — [Villkor för Sök företagsinformation](https://foretagsinfo.bolagsverket.se/sok-foretagsinformation-web/villkor)

29 412 föreningar är inte "en begränsad mängd information". Det är samma typ av spärr som
Boverket-avtalets § 5. Dessutom är tjänsten aktivt botskyddad (F5/TSPD Shape — HTML:en
innehåller bara `/TSPD/…`-skript, ingen data), så automatiserad hämtning är blockerad *by
design*, inte bara i villkorstext.

**b) API för att hämta företagsinformation** — kräver påskrivet avtal, 5 000 kr
anslutningsavgift, sedan månadsavgift i nivåer.

> "Om du vill kunna hämta dokument och handlingar, till exempel registreringsbevis eller
> årsredovisningar, väljer du också en nivå för dokument och handlingar. Det är bara när du
> hämtar ett dokument som det räknas mot den nivån. Att söka efter vilka dokument som finns
> för ett företag räknas inte som en hämtning av dokument."
> — [API för att hämta företagsinformation](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/apiforatthamtaforetagsinformation.3988.html)

| Dokument/mån | Kr/mån exkl. moms | Effektivt kr/dokument |
|---|---|---|
| 100 | 4 000 | 40 |
| 1 000 | 40 000 | 40 |
| 5 000 | 200 000 | 40 |

Transaktioner (uppslag) prissätts separat: 15 000/mån kostar 24 000 kr/mån.

**Kostnad för en årgång av våra 29 412 BRF:er:**
≈ 1 176 000 kr i dokumentavgifter + ~48 000 kr i transaktioner + 5 000 kr anslutning
≈ **1,23 MSEK exkl. moms**, och minst sex månader eftersom taket är 5 000 dokument/månad.
Via e-tjänsten i stället: 29 412 × 75 = **2,2 MSEK** — och där förbjuder villkoren det.

---

## 2. Format

| Kanal | Företagsform | Format | Parsning |
|---|---|---|---|
| Värdefulla datamängder (fri) | Endast aktiebolag | iXBRL i zip, veckovisa filer, 2020→ | Löst problem — `parsa_ixbrl.py` |
| E-tjänst / API-dokument (avgift) | Alla, inkl. BRF | **PDF** | Sannolikt skannad bild → OCR + LLM-extraktion |

Bekräftat i e-tjänsten för BRF Hammarbacken: `Format: Digitalt … Pdf`, 75,00 kr. "Digitalt"
avser leveranssättet, inte att innehållet är strukturerat.

**Öppen fråga:** är PDF:en skannad bild eller textbärande? Inlämningen sker på papper, så
skannad bild är huvudhypotesen — men det är inte verifierat, eftersom jag inte köpt något
dokument. Det är den första saken piloten ska mäta (75 kr).

Konsekvens om hypotesen håller: ingen fältmappning som i iXBRL. Varje siffra måste OCR:as ur
en fritt formaterad resultat- och balansräkning, med varierande radbenämningar mellan
förvaltare, och verifieras. Det är en helt annan pipeline än foretagskolls — och en helt annan
felprofil (tyst fel i stället för tomt fält).

---

## 3. Stickprov — 5 föreningar, 2026-09-02

Uppslag i Bolagsverkets e-tjänst (ärendesök + handlingsutbud), ett i taget, inget köpt.

| Orgnr | Förening | Ärende RÅ 2025 | Status | Köpbar årsredovisning |
|---|---|---|---|---|
| 716421-5423 | Bostadsrättsföreningen Hammarbacken | 3051443/2026 | Väntar på handläggning | Ja, men senast **2006** |
| 789200-1061 | Bostadsrättsföreningen Marmen | 3005528/2026 | Väntar på handläggning **av komplettering** | Nej — ingen alls |
| 702000-5018 | HSB Brf Erland i Stockholm | 3047278/2026 | Väntar på handläggning | Nej — ingen alls |
| 702000-6305 | HSB Brf Fredhäll i Stockholm | 3046136/2026 | Väntar på handläggning, **inkom 2026-06-05** | Ja, men senast **2005** |
| 702001-1891 | HSB Brf Korsriddaren i Stockholm | 3054031/2026 | Väntar på handläggning | Nej — ingen alls |

**5 av 5 har lämnat in för räkenskapsår 2025-01-01–2025-12-31. 0 av 5 är registrerade, alltså
0 av 5 tillgängliga att köpa.** Samtliga är märkta "Avgiftsfritt ärende". Hammarbacken och
Fredhäll har dessutom ett ärende "Påminnelse om att skicka in årsredovisningen — påminnelse
skickad" i historiken.

Fredhälls ärende kom in **2026-06-05** och är efter nästan tre månader fortfarande inte
påbörjat. Det stämmer med Bolagsverkets egen kö per 2026-08-31:

| Årsredovisningsärende | Handläggningstid | Påbörjar nu ärenden som kom in |
|---|---|---|
| Aktiebolag | 50 arbetsdagar | 23 juni |
| **Ekonomiska föreningar** | **74 arbetsdagar** | **18–22 maj** |
| Digitalt inlämnade (AB) | 1 arbetsdag | 31 juli–4 september |

— [Våra handläggningstider](https://bolagsverket.se/omoss/varverksamhet/varservice/varahandlaggningstider.2081.html)

Även om vi hade pengar och rätt att köpa i bulk finns materialet alltså ännu inte att köpa.
Första vågen blir registrerad ungefär **oktober–december 2026**.

### Kontrollprov mot gratis-API:et

Jag testade även Bolagsverkets fria API direkt med våra befintliga nycklar:
25 bostadsrättsföreningar (de 5 ovan + 20 slumpade, stratifierade över hela registret).

**Samtliga 25 gav `{"dokument": []}`.** En kontroll mot ett litet aktiebolag gav tvärtom en
träfflista och ett hämtbart paket (`…​.xhtml` i zip, 244 kB iXBRL). Dokumentationens
avgränsning stämmer exakt: gratisflödet innehåller aktiebolag, inget annat.

### Bugg upptäckt på vägen

`arsredovisning_enricher.py` i detta repo pekar på `https://gw.api.bolagsverket.se/dokument/v1`
— den vägen finns inte för oss och ger `403 API Subscription validation failed`. Rätt bas-URL
är `https://gw.api.bolagsverket.se/vardefulla-datamangder/v1` (samma operationer:
`POST /dokumentlista`, `GET /dokument/{id}`), och den fungerar med nycklarna vi redan har.
Skriptet har aldrig kunnat köra — kolumnen `arsredovisning_data` är NULL för alla 29 412.

Rättningen är en rad, men den ger **noll rader för BRF** och är alltså bara värd att göra om
vi vill använda samma kod för aktiebolag. **Inte rättat, väntar på ditt besked.**

---

## 4. Täckningsskattning

**Per förening: nej, inte lagligt och inte i skala.** Den enda signalen som visar om en
enskild BRF lämnat in är ärendesöket i e-tjänsten — som är botskyddat och vars villkor
begränsar både lagring och vidareförmedling. Att köra 29 412 uppslag där vore samma
övertramp som bulk-nedladdning hos Boverket.

**Aggregerat: delvis, gratis.** Bolagsverket publicerar
[`rakenskaps_forsening.csv`](https://static.bolagsverket.se/statistik/rakenskaps_forsening.csv)
under **CC BY 2.5 SE** — "antal inkomna årsredovisningar per räkenskapsperiod … samt hur stor
andel som fått förseningsavgift".

| Räkenskapsperiod | Ska skicka in | Inkomna | Andel | Förseningsavgift |
|---|---|---|---|---|
| 2024 | 723 619 | 726 140 | 100,4 % | 3,88 % |
| 2025 | 741 390 | 734 580 | 99,1 % | 3,55 % |
| 2026 | 791 315 | 28 707 | 3,6 % | 0 % |

**Använd inte 99,1 % som BRF-täckning.** Tre invändningar: filen saknar uppdelning på
företagsform och län (dimensionskolumnerna är tomma); andelen överstiger 100 % för 2024,
vilket visar att täljare och nämnare inte är samma population; och ökningen 2024→2025 är bara
+17 771 trots att ~40 000 ekonomiska föreningar tillkom som inlämningsskyldiga. Siffran
domineras av aktiebolag.

**Bästa tillgängliga referenspunkt** är Bolagsverkets egen uppgift: "Senast den 31 juli ska
cirka 523 000 aktiebolag och 40 000 ekonomiska föreningar lämna in sin årsredovisning" —
plus vårt stickprov 5/5. Vill vi ha ett riktigt tal är rätt väg att **fråga Bolagsverket
direkt** hur många av landets ~29 000 bostadsrättsföreningar som lämnat in för RÅ 2025.
Det är en offentlig statistikuppgift och kostar ett mejl.

---

## 5. Datafält och var de skulle landa

Vad en BRF-årsredovisning enligt K2 (BFNAR 2016:10) eller K3 innehåller, och vad vi realistiskt
kan få ut ur en OCR:ad PDF:

| Fält | Källa i dokumentet | Säkerhet |
|---|---|---|
| Årets resultat | Resultaträkning | Hög |
| Årsavgifter, hyresintäkter | Resultaträkning / not | Hög |
| Räntekostnader | Resultaträkning | Hög |
| Långfristiga skulder (lån) | Balansräkning | Hög |
| Eget kapital, summa tillgångar | Balansräkning | Hög |
| **Soliditet** | Beräknas: EK / tillgångar | Hög (härledd) |
| **Belåning per kvm** | Flerårsöversikt, annars lån / total yta | Medel |
| Årsavgift per kvm | Flerårsöversikt | Medel |
| Antal lägenheter, total yta | Förvaltningsberättelse | Medel |
| Fond för yttre underhåll | Balansräkning / not | Medel |
| Underhållsplanens horisont | Förvaltningsberättelse, fritext | Låg |
| Genomsnittlig ränta, bindningstid | Not om skulder | Låg–medel |

**Inga personnamn.** Styrelseledamöter, revisor och firmatecknare hämtas aldrig ur dokumenten.
Det gäller även indirekt: signaturrutor och underskriftssidor ska kastas i förbehandlingen,
inte filtreras i efterhand.

**Var det landar på sajten.** `app/brf/[slug]/page.tsx` har idag *ingen* ekonomisektion alls —
sidan består av Om, Registeruppgifter, Från Bolagsverket, energideklaration, FAQ och kontakt.
Ekonomidata skulle bli ett nytt block mellan Registeruppgifter och energiblocket, byggt som
`EnergiFakta.tsx` (samma kortmönster, källa + datum per uppgift) och med en
`EkonomiEjRegistrerad`-variant för de föreningar vi saknar — precis som `EnergiEjRegistrerad`.
Det är också det enda blocket som skulle ge sidorna ett eget skäl att rankas på
"brf X ekonomi", "brf X skuldsättning", "brf X årsavgift".

**Publicering.** Siffror är fakta och inte upphovsrättsskyddade; själva dokumentet och dess
löptext är en annan sak. Vi publicerar extraherade nyckeltal med källhänvisning
("Bolagsverket, årsredovisning räkenskapsår 2025"), aldrig PDF:en, aldrig långa textutdrag.
E-tjänstens villkor pekar uttryckligen på upphovsrättslagen som användarens ansvar.

---

## 6. Bedömning och pilotplan

### Bedömning

| Fråga | Svar |
|---|---|
| Laglighet, fri kanal | Fri kanal finns men omfattar **bara aktiebolag**. Ingen väg in för BRF. |
| Laglighet, betald kanal | Avtal krävs. E-tjänstens villkor förbjuder bulk uttryckligen. API-avtalet är den enda hållbara vägen — och dess villkor måste läsas före påskrift. |
| Format | Skannad PDF (hypotes, ej verifierad). Inte iXBRL, och blir det inte 2026 eller 2027. |
| Täckning | Inlämning pågår och verkar hög (5/5 i stickprovet), men **0 % är registrerat och köpbart** i dag. Kön för ekonomiska föreningar är 74 arbetsdagar. |
| Pipelineåterbruk från foretagskoll | **Nära noll.** `parsa_ixbrl.py` och `hamta_bulkfiler.py` löser ett problem vi inte har. Bara Supabase-upsert och `financials`-schemat är återanvändbara. Ny OCR-pipeline krävs. |
| Kostnad, en årgång | ≈ 1,23 MSEK exkl. moms via API-avtal, ≥ 6 månader. |

**Min rekommendation: bygg inte nu.** Inte för att det är olagligt — det finns en laglig väg,
den heter avtal och 1,23 MSEK — utan för att materialet ännu inte existerar att köpa, formatet
är det sämsta tänkbara, och hela problemet försvinner den dag Bolagsverket öppnar digital
inlämning för BRF. Då blir samma data gratis, strukturerad och avtalsfri, och foretagskolls
pipeline går att återanvända rakt av. Bolagsverket säger själva att BRF sannolikt blir först ut.

Det som är värt att göra nu är billigt och fyller kunskapsluckorna.

### Pilotplan

**Fas 0 — 0 kr, denna vecka.** Mejla Bolagsverket fyra frågor: (1) tidplan för digital
inlämning för bostadsrättsföreningar, (2) om skannade årsredovisningar för ekonomiska
föreningar planeras ingå i värdefulla datamängder, (3) hur många av landets
bostadsrättsföreningar som lämnat in för RÅ 2025, (4) om det finns en bulkväg för
dokumenthämtning utanför de publicerade nivåerna. Sätt bevakning på nyhetssidan.

**Fas 1 — ~750 kr, när registreringen kommit igång (tidigast oktober).** Köp 10
BRF-årsredovisningar via e-tjänsten à 75 kr, spritt över förvaltare (HSB, Riksbyggen,
SBC, egenförvaltade). Enda syftet: mät om PDF:erna är skannade bilder eller textbärande, och
kör en extraktion mot manuellt facit. **Grind:** om vi inte når ≥ 90 % korrekt på de fem
högsäkerhetsfälten (resultat, årsavgifter, räntekostnader, långfristiga skulder, eget kapital)
stannar projektet här.

**Fas 2 — 3 750 kr.** 50 föreningar. Mät precision per fält, inte i snitt. Manuellt facit på
10 av 50. Bygg `EkonomiFakta`-komponenten mot dessa 50 och titta på hur sidorna faktiskt ser ut
med riktig data. **Grind:** precision per fält och en bedömning av vad ett tyst fel kostar oss
— en felaktig skuldsiffra på en föreningssida är värre än en tom sektion.

**Fas 3 — beslutspunkt, inget byggande.** Bulk först när tre villkor är uppfyllda samtidigt:
precisionen håller, registreringskön har hunnit ikapp så täckningen är meningsfull, och
API-avtalets villkor är lästa och godkända av dig. Om Bolagsverket i det läget har annonserat
digital inlämning för BRF — vänta i stället.

**Inget av detta är påbörjat. Inget byggs förrän du godkänt.**

---

### Källor

- [Årsredovisning för ekonomisk förening – Bolagsverket](https://bolagsverket.se/foretag/forening/ekonomiskforening/arsredovisningforekonomiskforening.1405.html)
- [Ekonomiska föreningar ska fortsätta att lämna in årsredovisningen på papper (2026-08-28)](https://bolagsverket.se/omoss/nyheter/nyhetsarkiv/nyhetsarkiv2026/nyhetsarkiv2026/ekonomiskaforeningarskafortsattaattlamnainarsredovisningenpapapper.6083.html)
- [Nedladdningsbara filer](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/nedladdningsbarafiler.2517.html)
- [Värdefulla datamängder](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html)
- [API för värdefulla datamängder](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder/apiforvardefulladatamangder.5513.html)
- [API för att hämta företagsinformation (priser, avtal)](https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/apiforatthamtaforetagsinformation.3988.html)
- [Villkor för Sök företagsinformation](https://foretagsinfo.bolagsverket.se/sok-foretagsinformation-web/villkor)
- [Våra handläggningstider](https://bolagsverket.se/omoss/varverksamhet/varservice/varahandlaggningstider.2081.html)
- [Statistik: rakenskaps_forsening.csv (CC BY 2.5 SE)](https://static.bolagsverket.se/statistik/rakenskaps_forsening.csv)
- [Mappstruktur för inkomna årsredovisningar (iXBRL, endast AB)](https://vardefulla-datamangder.bolagsverket.se/arsredovisningar/)
- [BRF:s årsredovisning för 2025 och framåt ska skickas till Bolagsverket – Fastighetsägarna](https://www.fastighetsagarna.se/aktuellt/nyheter/2024/sverige/brfs-arsredovisning-for-2025-och-framat-ska-skickas-till-bolagsverket/)
