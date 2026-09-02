# BRF:ers egna hemsidor som källa till årsredovisningar — utredning + minipilot

**Datum:** 2026-09-02 · **Status:** minipilot körd, inget byggt, inget skrivet till `foretag`
**Jämför:** [BOLAGSVERKET-BRF.md](BOLAGSVERKET-BRF.md) (pappersvägen)

## Kort svar

**Skala inte.** Vägen ger i bästa fall runt **1–2 % täckning** av de 29 412 föreningarna, och
den siffra som köpare bryr sig mest om — **årets resultat — var fel i 4 av 10 handgranskade
dokument**. Värre: räknekontrollerna (balansräkningen går ihop, beräknad soliditet matchar
angiven) **godkände 3 av de 4 felen**. För YMYL-data är det diskvalificerande i nuvarande form.

Det finns däremot en smal, ärlig användning av fyndet — se § 7.

---

## 1. Urval — och en blockerare i `foretag`

Uppdraget var "100 slumpmässiga BRF:er med hemsida-fält ur `foretag`". Det gick inte:

> **`hemsida` är NULL för samtliga 29 412 bostadsrättsföreningar.** Kolumnen är helt tom.
> Den renderas heller ingenstans på sajten — `app/brf/[slug]/page.tsx` visar aldrig `hemsida`,
> bara rutan "Saknar föreningen en hemsida?".

Jag bytte urvalsram i stället för att stanna. **Ny ram: e-postdomänen.** En förening vars
e-post är `styrelsen@brfnejlikan.se` har med stor sannolikhet `brfnejlikan.se` som webbplats.

### Populationen (read-only mot `foretag`, alla 29 412)

| Kategori | Antal | Andel |
|---|---:|---:|
| Saknar e-post helt | 13 130 | 44,6 % |
| Frimejl (gmail/hotmail/telia/…) | 7 349 | 25,0 % |
| Icke-frimejl-domän | 8 933 | 30,4 % |
| — varav **unik domän (1 BRF)** ← urvalsram | **3 847** | **13,1 %** |
| — varav 2 BRF på samma domän | 330 | 1,1 % |
| — varav 3–9 BRF | 618 | 2,1 % |
| — varav 10+ BRF (förvaltare: hsb.se 955, riksbyggen.se 559, bblick.se 394, nabo.se 167, sbc.se 132 …) | 4 138 | 14,1 % |

Urvalet: **100 föreningar draget med `random.seed(20260902)` ur de 3 847.** URL:erna
normaliserades (schema, gemener, skräpstädning) och testades som `https://<domän>`, med
`http://` och `www.`-varianter i en andra omgång.

**Ramens partiskhet, uttryckligen:** detta är ett urval av föreningar som *redan bevisat* att
de har en egen domän. Täckningen som mäts här är därför en **övre gräns** för den gruppen —
och samtidigt en **undre gräns** för populationen, eftersom föreningar med hemsida men med
gmail-adress i registret inte finns med. Uppskalningen i § 3 hanterar båda felkällorna.

---

## 2. Crawlen

| Regel | Utfall |
|---|---|
| robots.txt hämtas och respekteras | 57 sajter hade en, 17 gav 404, 4 länkar avvisades av robots, **1 sajt (accedo.tv) förbjuder allt för alla → hoppades över helt** |
| Max 1 request/sekund per värd | efterlevt (global lås per värdnamn, 10 sajter parallellt) |
| Max 20 sidor per sajt | efterlevt (hård räknare; robots.txt och PDF-hämtning räknas separat) |
| User-Agent | `brfinfo-research/1.0 (+https://brfinfo.se/kontakt; engangsundersokning, max 1 req/s)` |
| Ingen UA-förklädnad | de 6 sajter som svarade 403 på vår ärliga UA lämnades i fred |

Länkar plockades när `årsredovisning` / `arsredovisning` / `bokslut` fanns i länktext,
filnamn eller URL. Navigationen prioriterade sidor med ekonomi-/dokument-/föreningsord.

---

## 3. Täckning

### I urvalet (n = 100)

| | Antal | Andel |
|---|---:|---:|
| **(a) Svarar** (HTTP < 400) | **68** | 68 % |
| **(b) Har publik årsredovisnings-PDF** | **14** | 14 % |
| **(c) Login-vägg upptäckt** | **27** | 27 % |
| **(d) Pekar mot förvaltardomän/portal** | **19** | 19 % |

De 32 som inte svarade: 24 svarade inte alls (DNS/TLS/timeout), 6 gav **403** mot vår
crawler, 1 gav 500, 1 gav 404. Andra omgången med `http://` och `www.`-varianter
**räddade noll** — domänerna är mejldomäner utan webbplats, inte felnormaliserade URL:er.

Portalerna bakom (d): `hsb.se` (3), `*.bostadsratterna.se` (4), `hemsida.sbc.se` (1), samt
egna sajter med inloggad medlemsdel. Tio av de hundra sajterna kör samma plattform
(Bostadsrätternas — igenkänd på robots.txt med `/faktureringsuppgifter/`, `/kalender/`,
`/resetPassword/`), 17 kör WordPress.

**Färskhet är faktiskt bra:** av de 14 sajterna med PDF hade **8 lagt ut räkenskapsår 2025**
och 6 hade 2024 som senaste. Median 7 årsredovisningar per sajt — de som publicerar
publicerar hela arkivet.

### Uppskalat till 29 412

```
3 847 föreningar i ramen (unik e-postdomän)
  × 14 % med publik AR-PDF
  ≈ 539 föreningar                              = 1,8 % av 29 412
  × ~69 % textbärande PDF (§ 4)
  ≈ 370 föreningar med maskinläsbart dokument   = 1,3 % av 29 412
  × ~50 % fullt korrekt extraktion (§ 5)
  ≈ 185 föreningar med data vi vågar publicera  = 0,6 % av 29 412
```

Lägg till ett okänt mörkertal: föreningar med egen hemsida men frimejl eller ingen e-post i
registret. Även om den gruppen vore **dubbelt så stor** som ramen landar vi på ~4 % med publik
PDF och ~1,8 % publicerbart. **Storleksordningen är låga ental procent, inte tiotals.**

---

## 4. Format

32 PDF:er hämtades från 13 föreningar (senaste årgången plus en jämförelseårgång per sajt).

| | Dokument | Andel |
|---|---:|---:|
| Inget textlager alls (skannad bild, `pdftotext` ger < 30 tecken) | 10 | 31 % |
| Textbärande (1 700–4 200 tecken/sida) | 22 | 69 % |
| — varav verifierat OCR-skadad textlager | 1 | |

Två av 13 föreningar publicerar uteslutande inskannade PDF:er. Där krävs OCR, med samma
felprofil som Bolagsverkets pappersspår.

**En fälla värd att notera:** min första brusdetektor flaggade 9 dokument som OCR-skadade.
Vid granskning var 8 av dem falsklarm — träffarna var **e-signatur-ID:n** (`ID:093aee10-1d67-…`,
Scrive/Verified-hashar) som ligger som sidfot på varje sida i signerade PDF:er, inte OCR-brus.
Bara `fridhemsgatan68.se` var genuint skadad (`SUMMA TILLG$NGAR`, `verksamhetsäret2O19`,
`20L8`). Automatiska kvalitetsmått på PDF-text ljuger lätt.

---

## 5. Extraktion på 10 dokument — precisionen, ärligt

Tio föreningar, ett textbärande dokument var, senaste tillgängliga år. Varje fält
**handgranskat mot källdokumentet** (jag läste resultat- och balansräkningen, inte bara
extraktorns utdata).

| Fält | Extraherade | Korrekta | Precision | Recall |
|---|---:|---:|---:|---:|
| Soliditet (angiven) | 10 | 10 | **100 %** | 100 % |
| Räkenskapsår | 10 | 9 | 90 % | 100 % |
| Summa eget kapital | 9 | 9 | **100 %** | 90 % |
| Årsavgift/kvm | 9 | 9 | **100 %** | 90 % |
| **Årets resultat** | 9 | **5** | **56 %** | 90 % |
| Summa tillgångar | 8 | 8 | **100 %** | 80 % |
| Räntekostnader | 8 | 8 | **100 %** | 80 % |
| Skuld/kvm (angiven) | 7 | 7 | **100 %** | 70 % |
| Långfristiga skulder — som fältet står | 7 | 7 | 100 % | 70 % |
| Långfristiga skulder — **som mått på belåning** | 7 | **6** | **86 %** | 70 % |
| Antal lägenheter | 4 | 4 | **100 %** | 40 % |
| Total yta | 1 | 1 | 100 % | **10 %** |

**5 av 10 dokument var helt korrekta. 4 hade fel årets resultat. 1 (det OCR-skadade) gav
nästan ingenting.**

### De tre felmekanismerna

**1. Fel kolumn — den farliga.** Fyra av fem fel på årets resultat kommer av att extraktorn
tar första raden i dokumentet som matchar "Årets resultat". Den raden ligger nästan alltid i
*förändring av eget kapital* eller i femårsöversikten, där kolumnordningen är en annan än i
resultaträkningen.

| Förening | Extraherat | Facit (resultaträkningen) | Fel |
|---|---:|---:|---|
| brfsjukhuset3.se | −3 668 045 | **−3 787 782** | föregående år |
| solventilen.se | −675 439 | **−993 760** | ingående balans |
| gardsasdalen.se | 6 914 331 | **7 694 755** | föregående år |
| fanan12.se | −1 239 676 | **120 161** | fel tabell |

Alla fyra ser fullständigt rimliga ut. Ingen av dem är ett uppenbart skräpvärde.

**2. "Långfristiga skulder" är inte föreningens belåning.** `brfnyboda1.se` redovisar
`Summa långfristiga skulder = 100 000 kr`. Den verkliga banklånen är **55 894 501 kr** — hela
lånestocken förfaller inom tolv månader och är omklassificerad till kortfristig, vilket
föreningen förklarar i not 8: *"Föreningen måste redovisa skulder som förfaller inom ett år
efter balansdagen som kortfristiga skulder."* Det är helt normal BRF-redovisning. Att läsa
"långfristiga skulder" som belåning underskattar skulden med **558 gånger**. Rätt fält är
`Skulder till kreditinstitut` i noten, långfristig + kortfristig del.

**3. Etiketter som ser rätt ut men inte är det.** Första versionen av extraktorn hämtade
`total_yta = 9 131` ur raden *"Skuldsättning / kvm totalyta"* och `antal_lägenheter = 2012`
ur en underhållsplansrad *"2012 | Injustering värme lägenheter"*. Båda fixade — men priset
var recall: antal lägenheter föll från 10 till 4 träffar, total yta till 1.

### Räknekontrollerna räcker inte

- Balansräkningen gick ihop i **8 av 8** dokument där båda summorna hittades.
- Beräknad soliditet (EK/tillgångar) matchade angiven soliditet inom 2 p.e. i **8 av 8**.
- **Men båda kontrollerna godkände brfsjukhuset3, solventilen och gardsasdalen — de tre
  dokument där årets resultat var fel år.**

Det är kärnproblemet. Kontrollerna validerar balansräkningen; felen sitter i
resultaträkningen och i tabeller som inte ingår i någon kontrollsumma. En felaktig
resultatsiffra passerar tyst hela vägen ut till en köpare som fattar beslut på den.

Den enda kontroll som faktiskt fångade något var jämförelsen mellan **beräknad** skuld/kvm
(15 kr) och föreningens **angivna** (8 216 kr) för brfnyboda1 — en 500× avvikelse som
larmade. Slutsats: kontroller som ställer *härledda* tal mot föreningens *egna* nyckeltal
fungerar; interna balanskontroller gör det inte.

---

## 6. Juridiska observationer

**robots.txt.** 57 av 100 sajter hade en. Vi respekterade den fullt ut: 4 länkar avvisades,
och `accedo.tv` (`User-agent: * / Disallow: /`) hoppades över helt. Ingen sida hämtades i
strid med en robots-regel.

**AI-crawlers är redan en fråga för BRF-sajterna.** 14 av 57 robots.txt-filer namnger
AI-crawlers explicit; minst en blockerar `ClaudeBot`, `anthropic-ai`, `Google-Extended`,
`CCBot`, `meta-externalagent`, `Applebot-Extended`, `PerplexityBot` med `Disallow: /`. Vår
UA är ingen av dem, men signalen är tydlig: en del föreningar vill inte att materialet
återanvänds maskinellt. Att bygga en produkt på deras dokument utan att fråga är en
förtroenderisk även där det är tekniskt tillåtet.

**403 mot en ärlig crawler.** Sex sajter blockerade oss på UA:n. Vi provade **inte** att gå
förbi med en webbläsar-UA. Om vi skalar måste den linjen hålla — annars är vi ett skrapverktyg
som kringgår bot-skydd, precis det Bolagsverkets e-tjänst spärrar mot.

**Inloggning = inte publikt.** 27 % av sajterna har en medlemsdel. Årsredovisningar bakom den
väggen är inte publicerade, och ska inte hämtas.

**Upphovsrätt.** Ingen av sajterna hade en villkorstext att citera — BRF-hemsidor har sällan
några. Men årsredovisningen är ett verk: siffrorna är fakta och fria, brödtexten och
utformningen är det inte. Publicera extraherade nyckeltal med källa och datum. Publicera
aldrig PDF:en och aldrig längre textutdrag.

**Personuppgifter.** Extraktorn hoppar över rader med `styrelse`, `revisor`, `ordförande`,
`ledamot`, `suppleant`, `firmatecknare`, `underskrift`, `valberedning`, `namnförtydligande`.
Inga personnamn har extraherats eller sparats.

**Efterlevnad av dina hårda regler:** inget skrevs till `foretag` (alla anrop var `select`);
inga personnamn extraherades; sparat resultat är enbart siffror + käll-URL + hämtdatum;
inget byggdes i produktion; **alla 32 nedladdade PDF:er är raderade** (se avslutningen).

---

## 7. Rekommendation

**Skala inte den här pipen som datakälla.** Skälen, i fallande vikt:

1. **Täckningen bär inte.** ~1–2 % av databasen med publik PDF, ~0,6 % efter format- och
   kvalitetsbortfall. En ekonomisektion som finns på 200 av 29 412 sidor är inte en produkt,
   den är en kuriositet — och den skapar en förväntan vi inte kan infria på resten.
2. **Felen är tysta och sitter i fel siffra.** 56 % precision på årets resultat, och
   räknekontrollerna godkänner felen. På YMYL-data är ett trovärdigt fel dyrare än ett tomt
   fält.
3. **Underhållsbördan är per sajt.** 3 847 heterogena WordPress-, Bostadsrätterna- och
   egenbyggda sajter som byter tema och flyttar filer. Det är inte en pipeline, det är 3 847.
4. **Förtroenderisken.** Vi skulle bygga en kommersiell tjänst på föreningarnas eget material,
   varav några uttryckligen ber AI-crawlers hålla sig borta.

**Det som däremot är värt att ta vidare — tre saker, i ordning:**

**a) Länka, extrahera inte.** Där vi hittat en publik årsredovisnings-PDF: visa
"Föreningen publicerar sin årsredovisning på sin egen webbplats →" med länk till *sidan*
(inte PDF:en). Noll extraktionsrisk, äkta nytta, och det ger ~500 sidor något unikt. Kräver
en `hemsida`-kolumn som faktiskt är fylld.

**b) Fyll `hemsida`.** Kolumnen är tom för alla 29 412 och används inte i produkten. Ramen
ovan (unik e-postdomän + verifierat svar) ger ~2 600 verifierade hemsidor till en engångskörning
på ett par timmar. Det är i sig en produktförbättring och en förutsättning för (a).
Separat beslut, separat körning.

**c) Låt föreningen lämna siffrorna själv.** Den befintliga claim-/hemsida-tratten är rätt
plats: en förening som gör anspråk på sin sida får ladda upp eller fylla i sina nyckeltal.
Då är källan namngiven, aktuell och juridiskt oproblematisk — och det är samma föreningar
som är köpare av hemsidespaketet.

**Om du ändå vill testa extraktion i skarpt läge** är minimikravet innan något visas publikt:
resultatsiffran hämtas ur *resultaträkningen* med kolumnrubrikerna som ankare (inte första
träffen i dokumentet); belåning hämtas ur noten `Skulder till kreditinstitut`, inte ur
långfristiga skulder; varje publicerad siffra korsvalideras mot föreningens egen
femårsöversikt och döljs vid avvikelse. Först därefter en ny 50-dokuments granskning med
handfacit — och grind på ≥ 95 % på årets resultat, inte 56 %.

---

### Metodfiler

Körda i scratchpad, inget i repot: `pull_brf.py` (read-only-uttag), `crawl.py` (artig crawl),
`pass2.py` (URL-normalisering), `getmore.py` (formatstickprov), `extract.py` (extraktion +
räknekontroller). Urval: `random.seed(20260902)`. Rådata (`crawl_resultat.json`,
`extraktion10.json`) finns kvar i scratchpad; PDF:erna är raderade.
