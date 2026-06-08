# Genomgång av brfinfo-projektet

_Genererad 2026-05-28. Next.js 15.3.8 (App Router) + Supabase. Statisk + serverrenderad webbplats för Sveriges BRF-register._

---

## 1. STRUKTUR — sidor & routes

Alla routes ligger under `app/`. Märkning: ○ = statiskt prerenderad, ƒ = serverrenderad on demand (enligt build).

| Route | Fil | Typ | Datakälla |
|---|---|---|---|
| `/` | `app/page.tsx` | ○ Static | `getFeaturedBRFs(6)` |
| `/sok` | `app/sok/page.tsx` | ƒ Dynamic (`force-dynamic`) | `searchBRFs(q)` / `getBRFsByCity(stad)` |
| `/brf/[slug]` | `app/brf/[slug]/page.tsx` | ƒ Dynamic | `getBRFBySlug(slug)` |
| `/stad/[city]` | `app/stad/[city]/page.tsx` | ƒ Dynamic | `getBRFsByCity(cityName, 30)` |
| `/forvaltare` | `app/forvaltare/page.tsx` | ○ Static | `getForvaltareList()` (hämtas vid build) |
| `/forvaltare/[slug]` | `app/forvaltare/[slug]/page.tsx` | ƒ Dynamic | `getForvaltareBySlug(slug)` |
| `/forvaltare-partner` | `app/forvaltare-partner/page.tsx` | ○ Static | — (statiskt innehåll + `PartnerForm`) |
| `/claima` | `app/claima/page.tsx` | ○ Static | — (statiskt innehåll + `ClaimaForm`) |
| `/sitemap.xml` | `app/sitemap.ts` | ƒ Dynamic (`force-dynamic`) | Supabase: alla `slug` |
| `/robots.txt` | `app/robots.ts` | ○ Static | — |
| `/_not-found` | `app/not-found.tsx` | ○ Static | — |

**API-routes (ƒ, `force-dynamic`):**
- `POST /api/claima` — `app/api/claima/route.ts`
- `POST /api/forvaltare-kontakt` — `app/api/forvaltare-kontakt/route.ts`

**Layout & klientkomponenter:**
- `app/layout.tsx` — root layout, Google Fonts (Fraunces + DM Sans), `metadataBase`, `Nav`/`Footer`/`ScrollToTop`/`GoogleAnalytics`.
- `components/`: `Nav.tsx`, `Footer.tsx`, `SearchBox.tsx` (klient), `BRFCard.tsx` (klient), `GoogleAnalytics.tsx` (klient, GA-id `G-0281GKZT7X`), `ScrollToTop.tsx` (klient).
- Formulärkomponenter: `app/claima/ClaimaForm.tsx`, `app/forvaltare/[slug]/ForvaltareKontaktForm.tsx`, `app/forvaltare-partner/PartnerForm.tsx`.

> `/brf/[slug]` och `/stad/[city]` saknar `generateStaticParams` → renderas on demand (rimligt vid ~27 000 BRF:er).

---

## 2. DATABAS — Supabase

All dataåtkomst går via `lib/supabase.ts` med anon-nyckeln. **En enda tabell används: `foretag`.**

**Klient:**
```ts
createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
// fallback till placeholder.supabase.co om env saknas
```

**Kolumner som läses** (från typen `BRF` + `select('*')`):
`orgnr, namn, postort, kommun, lan, bransch, anstallda, juridisk_form, telefon, email, adress, startdatum, status, rank_score, hemsida, infotext, slug, lat, lng, rating, review_count, featured, verified, forvaltare, bolagsverket_data` (JSON-kolumn med `verksamhetsbeskrivning`, `postadress_detaljer.coAdress`, `sni_koder`, m.m.).

**Queries (alla filtrerar `juridisk_form = 'Bostadsrättsföreningar'`):**

| Funktion | Query |
|---|---|
| `getBRFBySlug` | `.eq('slug', …).single()` |
| `searchBRFs` | `.or(namn/postort/adress ilike %q%)` + `.order(rank_score desc)` `.limit(30/40)`. Strippar prefix "brf"/"bostadsrättsföreningen". |
| `getBRFsByCity` | `.ilike('postort', %city%)` + `.order(rank_score desc)` |
| `getFeaturedBRFs` | `.eq('status','Är verksam')` + `.order(rank_score desc)` `.limit(6)` |
| `getForvaltareList` | Paginerar **alla** rader (`bolagsverket_data not null`, batch 1000), extraherar förvaltare ur `forvaltare`-kolumn eller `coAdress`, räknar, filtrerar `count >= 2`. |
| `getBRFsByForvaltare` | Paginerar **alla** rader igen och filtrerar i JS på extraherad förvaltare. |
| `getForvaltareBySlug` | `getForvaltareList()` → matcha slug → `getBRFsByForvaltare()`. |
| `sitemap.ts` | Egen klient: `.select('slug').not('slug', is null).limit(50000)`. |

---

## 3. FORMULÄR — kontaktflöden

Det finns **tre formulär med två olika backends** (blandat):

| Formulär | Backend | Skickar till |
|---|---|---|
| `ClaimaForm` (`/claima`) | **Resend** via `POST /api/claima` | `LEAD_EMAIL` (fallback `info@brfinfo.se`) |
| `ForvaltareKontaktForm` (`/forvaltare/[slug]`) | **Resend** via `POST /api/forvaltare-kontakt` | `LEAD_EMAIL` |
| `PartnerForm` (`/forvaltare-partner`) | **Web3Forms** (client-side `fetch` direkt) | Web3Forms access_key `8cef0758-…712b6` |

**Resend-routes:** validerar obligatoriska fält → `new Resend(RESEND_API_KEY)` → `resend.emails.send({ from: 'BRFinfo <noreply@brfinfo.se>', … })`. Felhanteras med try/catch och returnerar `{ ok: true }` / 400 / 500.

**Web3Forms:** `PartnerForm` postar JSON direkt till `https://api.web3forms.com/submit` med hårdkodad `access_key` (publik nyckel, by design hos Web3Forms). Kräver ingen serverväg och ingen Resend-konfiguration.

---

## 4. BEROENDEN (`package.json`)

**dependencies:**
- `next` 15.3.8
- `react` ^18.3.1 / `react-dom` ^18.3.1
- `@supabase/supabase-js` ^2.39.0
- `resend` ^3.0.0

**devDependencies:**
- `typescript` ^5, `@types/node` ^20, `@types/react` ^18, `@types/react-dom` ^18
- `tailwindcss` ^3.4.1, `autoprefixer` ^10.4.17, `postcss` ^8.4.35

> Obs: Tailwind är installerat men sidorna använder nästan uteslutande inline-`style`. `resend` används bara av de två API-routes (Web3Forms-flödet behöver det inte).

**Miljövariabler** (`.env.local.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `LEAD_EMAIL`, `NEXT_PUBLIC_SITE_URL`.

**Konfig:** `next.config.js` (bild-remotePatterns `*.supabase.co`), `vercel.json` (`{"framework":"nextjs"}`), `tsconfig.json` (`strict: true`, `target: es5`, alias `@/*`).

**Python-skript** i repo-roten (`brf_enricher.py`, `arsredovisning_enricher.py`, `extract_forvaltare.py` + loggar) är fristående datainmatnings-/anrikningsverktyg, inte del av Next.js-bygget.

---

## 5. KÄNDA PROBLEM

**Typer/build:** Inga TypeScript-fel, inga byggvarningar, inga trasiga imports. `next build` typkontrollerar (strict) och passerar rent.

**Funktionella/innehållsmässiga avvikelser att titta på:**

1. **Inkonsekvent priskommunikation.** `ForvaltareKontaktForm` visar `299/590/990 kr/mån`, medan `PartnerForm` och `/forvaltare-partner` visar `490/990/2490 kr/mån`. Bör synkas.
2. **Blandade formulär-backends.** Två av tre formulär går via Resend (kräver verifierad domän + `RESEND_API_KEY`), det tredje via Web3Forms. `/api/forvaltare-kontakt` refererar fortfarande `body.paket`/`body.forvaltare` — `paket` är en rest från när PartnerForm postade dit; idag används routen bara av `ForvaltareKontaktForm` (skickar `forvaltare`, inte `paket`).
3. **Tung förvaltar-logik.** `getForvaltareList` och `getBRFsByForvaltare` läser in **hela** `foretag`-tabellen i minnet (paginering 1000/batch) och filtrerar i JS. `getForvaltareBySlug` gör det två gånger per request. Vid ~27 000 rader är det dyrt och bör ersättas med en aggregerad DB-query/vy eller materialiserad förvaltarkolumn.
4. **Hårdkodade siffror.** "26 795 BRF:er" och stad-counts på startsidan är hårdkodade i `app/page.tsx` (matchar inte nödvändigtvis databasen).
5. **Web3Forms access_key i klientkod** (`PartnerForm.tsx:35`). Publik nyckel by design hos Web3Forms, men saknar spam-/honeypot-skydd — överväg `botcheck`-fält.
6. **Resend `from: noreply@brfinfo.se`** kräver verifierad avsändardomän i Resend, annars failar utskicket (fångas tyst som 500 "E-post misslyckades").
7. **Supabase-fallback till placeholder.** Saknas env-variabler returnerar queries tomt utan synligt fel (förutom `/sok` som visar felmeddelande). Bra för att inte krascha bygget, men kan dölja felkonfiguration i produktion.

---

## 6. BUILD-STATUS

`npm run build` → **OK (exit 0)**.

```
▲ Next.js 15.3.8
✓ Compiled successfully
✓ Generating static pages (8/8)
```

- Inga fel, inga varningar.
- 8 statiska sidor prerenderade, övriga serverrenderade on demand.
- First Load JS (delad): **101 kB**. Tyngsta sidor (`/`, `/sok`, `/stad/[city]`): ~162 kB.

| Status | Resultat |
|---|---|
| Kompilering | ✓ |
| Typkontroll (strict) | ✓ inga fel |
| Linting | ✓ |
| Statisk generering | ✓ 8/8 |

---

### Sammanfattning
Projektet bygger rent och är funktionellt komplett. De viktigaste sakerna att åtgärda är icke-kritiska: **synka priser** mellan formulären, **överväg en enhetlig formulär-backend**, och **optimera förvaltar-queryerna** (de skannar hela tabellen). Inga blockerande tekniska fel.
