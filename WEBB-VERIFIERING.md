# Webb-verifieringsbatchen — pilot 200

**Datum:** 2026-09-02 · **Status:** byggt, pilot körd i `--dry-run`, **inget skrivet, inget committat**
**Bakgrund:** [EGNA-HEMSIDOR.md](EGNA-HEMSIDOR.md) · **Jämför:** [BOLAGSVERKET-BRF.md](BOLAGSVERKET-BRF.md)

## Två saker att ta ställning till innan bulk

**1. Urvalsramen.** Specen säger "utgå från `foretag.hemsida` där fältet finns — gissa ALDRIG
domäner". `foretag.hemsida` är NULL för alla 29 412. Kört rakt av blir batchen en no-op:

```
$ python3 webb_verifierare.py --pilot 200 --kalla hemsida-falt --dry-run
foretag: 149479 rader i 7-serien, varav 29412 BRF
kandidater (hemsida-falt): 0
```

Piloten kördes därför på `--kalla epost-doman`: föreningens **egen registrerade e-postdomän**,
och bara när domänen bärs av exakt en förening. Det är inte en gissning ur namnet — adressen
kommer från föreningen själv — men det är en annan ram än specen, och identitetskontrollen är
det enda som skiljer den från en gissning. Båda källorna finns i skriptet; `hemsida-falt` är
default. **Säg till om du vill ha ramen ändrad.**

**2. Volymen är lägre än vi trodde.** Jag skrev "~2 600" i förra rapporten — det talet var
antalet domäner som *svarar*, inte antalet som visar sig tillhöra föreningen. Efter
verifiering: **~1 300**, inte 2 600. Se uppskalningen nedan.

---

## Vad som är byggt

| Fil | Innehåll |
|---|---|
| `db/webb_schema.sql` | Tabellen `brf_webb`, constraints, index, trigger, RLS + kolumnrättigheter, verifieringsfrågor. **Inte körd** — kräver SQL Editor. |
| `webb_verifierare.py` | Crawler + verifierare. `--pilot N`, `--alla`, `--kalla`, `--dry-run`. |
| `lib/webb.ts` | Cachat index (`brf-webb-index-v1`, 1 h) → noll extra DB-anrop per sidvisning. |
| `components/WebbLankar.tsx` | Kortet på BRF-sidan. Returnerar `null` utan data. |
| `app/brf/[slug]/page.tsx` | Hämtar webbdata parallellt med energidata, renderar kortet. |
| `app/om-boten/page.tsx` | Sidan som botens User-Agent pekar på. |
| `app/sitemap.ts` | `/om-boten` tillagd. |

`npm run build` och `tsc --noEmit` går rent.

### Tabellen

`brf_webb` med orgnr som PK och ingen foreign key mot `foretag` — samma mönster som
`brf_utskick`. Namnkollisionen kontrollerad mot instansen först (72 tabeller, `brf_webb`
ledigt) efter lärdomen från `claims`.

En kolumn utanför specen: **`url_ursprung`** (`hemsida-falt` | `epost-doman` | `claim`). Utan
den går det inte att i efterhand skilja en URL som stod i registret från en som härleddes ur
e-postdomänen, och den skillnaden avgör hur mycket raden är värd. Säg till om den ska bort.

### RLS

Specen säger "anon får läsa URL-fälten". RLS är radnivå och kan inte begränsa kolumner, så
skyddet är tvådelat:

```sql
revoke all on public.brf_webb from anon, authenticated;
grant select (orgnr, hemsida_url, hemsida_status, hemsida_verifierad_at,
              arsredovisning_url, arsredovisning_hittad_at) to anon, authenticated;
create policy … for select to anon using (hemsida_status in ('ok','redirect'));
```

`robots_blockerad`, `kalla` och `url_ursprung` är interna och lämnar aldrig databasen.
Radfiltret gör dessutom att vår bedömning "död" eller "portal" inte går att läsa ut via
API:et — den är vår, inte föreningens. `lib/webb.ts` listar kolumnerna explicit; ett
`select('*')` ger `permission denied` och det är avsiktligt.

### Crawlern — artighet

* robots.txt hämtas per sajt, respekteras för vår UA **och** för `*`.
* **AI-crawler-blockeringar respekteras som opt-out.** Stänger en sajt ute `ClaudeBot`,
  `GPTBot`, `CCBot` m.fl. med `Disallow: /` så vänder vi, trots att vi inte är någon av dem.
  I piloten var det **20 av 200 sajter (10 %)** — den enskilt största artighetskostnaden,
  och den vi minst vill förhandla bort.
* 1 request/sekund per värdnamn (global lås, inte per tråd), max 20 sidor/sajt.
* UA: `brfinfo-bot (+https://brfinfo.se/om-boten; info@brfinfo.se)`.
* Ingen UA-förklädnad. De 2 sajter som svarade 403 lämnades i fred.
* Inga PDF:er hämtas. Boten noterar att en sida *länkar* till en årsredovisning och sparar
  **sidans** URL — aldrig PDF:ens. Inga siffror, inga personnamn.

Piloten kostade **1 625 requests** över 200 sajter (median 1 sida/sajt — de flesta domäner
är döda eller parkerade och kostar en enda hämtning).

---

## Pilotresultat (n = 200, seed 20260902)

| Utfall | Antal | Andel |
|---|---:|---:|
| **Verifierad egen hemsida** | **68** | **34,0 %** |
| — varav med publik årsredovisningssida | **42** | **21,0 %** |
| Fel förening (sajten är någon annans) | 42 | 21,0 % |
| Ingen kontakt (DNS/TLS/timeout) | 36 | 18,0 % |
| robots.txt: AI-opt-out | 20 | 10,0 % |
| Förvaltarportal | 15 | 7,5 % |
| Parkerad domän | 13 | 6,5 % |
| HTTP 500 / 403 / robots-disallow | 3 / 2 / 1 | 3,0 % |

**Bevistyp för de 68:** organisationsnumret på sidan **33**, föreningsnamnet i sajtens egen
titel/rubrik **30**, namnet i domänen bekräftat av sidan **5**.

**Årsredovisningslänkarna:** 36 av 42 pekar på en riktig dokument- eller ekonomisida
(`/arsredovisningar/`, `/foreningen/ekonomi`, `/maklarinformation/`), 6 bara på startsidan
eftersom länken bara fanns där.

### Exempel

```
verifierad + årsredovisning
  Brf Kvarnfallet i Sävedalen   brfkvarnfallet.se     → /arsredovisningar/
  Brf Kungsklippan i Stockholm  kungsklippan.se       → /om-foreningen/ekonomi/
  Brf Charlottendalshöjden      charlottendalshojden.se → /ekonomi/
  Brf Illern 1                  brfillern1.se         → /foreningen/ekonomi

portal (räknas aldrig som egen sajt)
  HSB Brf Metern i Stockholm    metern.se             → www.hsb.se
  Brf Nirvana                   brfnirvana.se         → brfnirvana.bostadsratterna.se

fel förening (domänen är någon annans)
  Brf Ormen Större 13           synsam.com
  Brf Olivilund                 cmdata.se
  Brf Sadelbyn 6                vihem.se

parkerad domän (föreningen äger adressen, men det finns ingen sajt)
  Brf Stengodset 16             brfstengodset16.se    → "Parked at Loopia"
  Brf Staren 8                  brfstaren8.se         → "Parked at Loopia"
```

---

## Verifieringen — och de fel den fångade

Första körningen gav **71 träffar. Fyra av dem var fel förening**, alltså 5,6 % felaktiga
länkar rakt ut på publika sidor. Jag hittade dem genom att hämta och läsa sajterna för hand:

| Förening | "Hemsida" | Vad sajten faktiskt är | Beviset som svek |
|---|---|---|---|
| Äpplet 18 i Västerås | arosgolvochplatt.se | golvläggarfirma | ordet "västerås" |
| BoKlok Solbacka By | norrtaljerevision.se | revisionsbyrå (föreningen är kund) | "boklok solbacka" i kundlistan |
| Sandhem 2 i Bollebygd | lyckasen.se | inredningsbutik | ordet "bollebygd" |
| Fåran 1 i Solna | brffaran.se | återanvänd domän, rubrik "OFFICE DECOR" | ordet "solna" |

Två skilda fel, båda rättade:

1. **Ortnamn är inte identitet.** "Västerås" står på varje lokal sajt. Orter är nu utestängda
   som identitetsord (`ORTER`, 100 kommuner).
2. **Att nämna ≠ att vara.** En revisionsbyrå listar gärna föreningen som kund. Namnet måste
   nu finnas både i brödtexten **och** i sajtens egen identitet — `<title>`, `<h1>` eller
   domänen. En titel som bara upprepar värdnamnet (`brffaran.se`) räknas inte.

Efter rättningen: **68 träffar, noll bekräftade felaktiga.** Alla 35 namn-/domänbaserade
granskade mot domän och titel, 8 av dem hämtade och lästa för hand. De 33 orgnr-baserade är
den starkaste bevisklassen — ingen listar en kunds organisationsnummer av misstag.

Under vägen antog jag att tre avslag (`granneborg.se`, `brfstengodset16.se`,
`brfhogmora51.se`) var falska negativ från JS-renderade sajter. **Fel gissning** — de är
parkerade Loopia-domäner. Avslagen var korrekta, och det blev i stället en egen felklass:
föreningen äger sin adress men har ingen sajt. 13 av 200.

Regressionsproven för alla åtta fallen ligger inbakade som exempel i docstringen till
`identitet_bekraftad()`.

---

## Uppskalning

```
3 843 kandidater i ramen (unik, egen e-postdomän)
  × 34,0 % verifierad egen hemsida  ≈ 1 307 föreningar   =  4,4 % av 29 412
  × 21,0 % med årsredovisningslänk  ≈   807 föreningar   =  2,7 % av 29 412
```

Bulkkörningen blir ~3 843 sajter × ~8 requests ≈ **31 000 requests**, med 8 parallella värdar
och 1 req/s ungefär **3–4 timmar**. Det ger ~1 300 nya länkar på BRF-sidor och ~800
årsredovisningslänkar — sidor som idag inte har något eget innehåll alls utöver registret.

Det korrigerar också "~2 600" från förra rapporten: hälften av de domäner som svarar visar
sig tillhöra någon annan än föreningen.

---

## Visningen

Kortet **"Föreningens egna sidor"** ligger mellan Bolagsverket-kortet och energideklarationen:

* "Föreningens hemsida →" med värdnamn och *Verifierad 2 september 2026*
* "Föreningen publicerar sin årsredovisning →" med *Hittad …* och raden
  "Dokumentet ligger hos föreningen. Vi läser inte innehållet."
* `rel="nofollow noopener"` — `noreferrer` utelämnas med flit så att föreningen ser i sin
  statistik att besökaren kom från oss.

`WebbLankar` returnerar `null` när data saknas, så **sidor utan data är byte-för-byte
oförändrade** — ingen rubrik, ingen tom rad, ingen extra höjd. Villkoret ligger i komponenten
och inte på anropsstället, så det inte kan glömmas bort nästa gång kortet återanvänds.

Läsningen går via ett cachat index över hela tabellen (`brf-webb-index-v1`, 1 h) i stället för
en query per sidvisning — instansen ligger nära disk-IO-taket och tål inte ett extra anrop per
BRF-sida. **Bumpa nyckeln till `-v2` när bulken landat**, annars kan en sida visa "ingen
hemsida" i upp till en timme efter att raden skrivits. Rad att ändra: `lib/webb.ts:60`.

`/om-boten` förklarar vad boten gör, vad den inte gör (laddar inte ner PDF:er, extraherar inga
siffror, sparar inga personuppgifter, går inte bakom inloggning, byter inte identitet) och hur
man stänger av den med två rader i robots.txt.

---

## Nästa steg — i ordning

1. **Du granskar** siffrorna och de 68 träffarna (`webb_pilot200_v4.json` i scratchpad).
   Särskilt: godkänner du e-postdomän-ramen, och ska `url_ursprung` vara kvar?
2. **Kör `db/webb_schema.sql`** i SQL Editor. Kontrollera med Block 4, punkt 6: ett
   `select * from brf_webb` med anon-nyckeln ska ge `permission denied`.
3. **Pilot skarpt:** `python3 webb_verifierare.py --pilot 200 --kalla epost-doman`
   (utan `--dry-run`, kräver `SUPABASE_SERVICE_ROLE_KEY`). Titta på 10 BRF-sidor lokalt.
4. **Bulk:** `--alla --kalla epost-doman`, 3–4 timmar.
5. **Bumpa `brf-webb-index-v1` → `-v2`** och deploya.
6. Sätt en kvartalsvis omkörning för `hemsida_verifierad_at < now() - interval '90 days'`.

**Ingenting av detta är gjort. Inget är skrivet till databasen, inget är committat.**

Not: skriptet läser `SUPABASE_SERVICE_ROLE_KEY` ur miljön och hårdkodar den inte — till
skillnad från `arsredovisning_enricher.py` och `brf_energi_enricher.py`, som båda bär en
kopia av nyckeln i klartext i ett publikt repo. Det är en separat sak att städa
(`SAKERHET-ROTATION.md`).
