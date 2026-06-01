# SEO-hygien: 404, noindex & canonical

_Genererad 2026-06-01. Åtgärdar GSC-fynd: 791 "Hittades inte (404)", 356 "Utesluten av noindex", 14 "Dubblett utan kanonisk", 4 "Sida med omdirigering". Sajten är frisk — detta är städning. "Alternativ sida med korrekt kanonisk tagg" (1 624) lämnades orörd (OK)._

## 1. Sitemap-generering

`app/sitemap.ts` (force-dynamic). URL-mönster:

| Mönster | Källa | Resolverar alltid 200? |
|---|---|---|
| `/`, `/sok`, `/claima`, `/forvaltare`, `/forvaltare-partner`, `/energideklaration`, `/kontakt`, `/integritet` | statiskt | Ja |
| `/energiklass/stockholm` | statiskt | Ja |
| `/stad/{city}` | hårdkodad lista | Ja (dynamisk route, accepterar allt) |
| `/brf/{slug}` | Supabase `foretag.slug` (live) | Ja — exakt slug ur DB |

**Slutsats:** sitemapen läser live från DB och pekar bara på existerande slugs. Den genererar alltså **inga** döda URL:er. De 791 historiska 404:orna kommer från **internlänkar** och gamla/ändrade slugs, inte från sitemapen.

## 2. 404-jakt — grundorsaker & åtgärder

### A. Hårdkodad död länk: `/forvaltare/bli-partner`
`app/forvaltare/page.tsx` länkade CTA:n "Bli partner" till `/forvaltare/bli-partner`. Den matchar `/forvaltare/[slug]`, och `getForvaltareBySlug("bli-partner")` → `notFound()` → **404 på varje rendering av förvaltarlistan**. Rätt sida finns på `/forvaltare-partner`.
→ **Fix:** länken pekar nu på `/forvaltare-partner`. Verifierat 200 i runtime.

### B. BRF → förvaltare: massa-404 (huvudkällan)
`app/brf/[slug]/page.tsx` byggde förvaltarlänken `/forvaltare/{slugify(coAdress)}` från **rå `coAdress`** — utan personnamnsfilter och utan antalsgräns. Men `getForvaltareBySlug` resolvade bara företagsförvaltare med **`count >= 2`**. Resultat: varje BRF vars `coAdress` var ett personnamn, eller en förvaltare med bara 1 BRF, länkade till en `/forvaltare/<slug>` som gav **404**. Med tusentals BRF-sidor → hundratals unika döda URL:er.

→ **Fix (två delar, så att länk == resolver):**
1. BRF-sidan använder nu samma `extractForvaltare(brf)` som listan/resolvern (exporterad från `lib/supabase.ts`). Den filtrerar bort personnamn → ingen länk renderas för dem (ingen 404).
2. `getForvaltareBySlug` resolvar nu med `minCount = 1` (ny parameter på `getForvaltareList`). Listsidan `/forvaltare` behåller `>= 2` (ingen brusig lista), men en förvaltar-detalj som nås via internlänk från en enskild BRF resolverar nu till 200 även med 1 BRF. Garanterar: varje renderad BRF→förvaltare-länk → 200.

### C. Övriga dynamiska routes
- `/stad/[city]` och `/energiklass/[stad]` accepterar valfri slug och returnerar 200 (tomt tillstånd vid behov) → ingen 404-källa.
- `/brf/[slug]` och `/forvaltare/[slug]` är de enda som kallar `notFound()`. Efter B länkar vi aldrig internt till en olöslig förvaltarslug. BRF-slugs länkas alltid från DB-data (`brf.slug`).

## 3. Internlänkar — granskning
Alla `href` i `app/` + `components/` gicks igenom. Enda döda mönster var A och B ovan. Övriga (`/`, `/sok`, `/claima`, `/stad/*` från kurerad lista, `/energideklaration`, `/energiklass/stockholm`, `/forvaltare`, `/kontakt`, `/integritet`, `/brf/{db-slug}`) verifierade 200.

## 4. noindex-audit (de 356)
`noindex` sätts på exakt två ställen, **båda avsiktliga**:
- `app/sok/page.tsx` → `robots: { index: false, follow: true }` — sökresultat ska inte indexeras. Varje `/sok?q=...`-variant som Google sett räknas separat → står för merparten av de 356.
- `app/admin/energi-stats/page.tsx` → `noindex, nofollow` — adminsida.

`app/layout.tsx` sätter globalt `index: true, follow: true`. **Ingen mall noindexar av misstag.** Ingen kodändring behövs — de 356 är korrekt uteslutna och bör valideras bort i GSC efter deploy.

## 5. Canonical (de 14 "Dubblett utan kanonisk")
Alla indexerbara sidor har nu self-referencing canonical. Enda lucka var `/claima`.
→ **Fix:** la till `alternates: { canonical: 'https://brfinfo.se/claima' }`. Verifierat i renderad HTML.
(`/sok` saknar canonical men är noindex → inte en dubblett-kandidat. `/brf` och `/forvaltare/[slug]` har redan self-canonical.)

## 6. Sitemap-täckning (bonus)
`app/stad/[city]/page.tsx` har **26 kurerade städer** (META) men sitemapen listade bara 12. Utökade `/stad`-listan till alla 26 (alla verifierade 200, kurerad meta/innehåll). Lade till: gavle, boras, eskilstuna, karlstad, lulea, sundsvall, trollhattan, halmstad, ostersund, falun, vaxjo, borlange, sodertalje, kalmar.

## 7. Build & runtime
- `npm run build` ✓ (Next 15.3.8, 11/11 sidor, inga typfel). `/forvaltare` och `/claima` prerendras statiskt.
- Runtime (`next start`): `/`, `/claima`, `/forvaltare`, `/forvaltare-partner`, `/stad/kalmar`, `/energideklaration`, `/energiklass/stockholm` → **200**. `/forvaltare/bli-partner`, `/denna-finns-inte` → **404** (not-found fungerar).
- Verifierat: `/claima` canonical renderas, `/sok` `noindex, follow` renderas, sitemap listar alla 26 städer.
- En enda `<h1>` per publik sida (admin undantaget — noindex).

## Ändrade filer
- `lib/supabase.ts` — exporterar `extractForvaltare`; `getForvaltareList(minCount=2)`; `getForvaltareBySlug` resolvar med `minCount=1`.
- `app/brf/[slug]/page.tsx` — använder `extractForvaltare` för förvaltarlänk.
- `app/forvaltare/page.tsx` — `/forvaltare/bli-partner` → `/forvaltare-partner`.
- `app/claima/page.tsx` — self-referencing canonical.
- `app/sitemap.ts` — `/stad`-listan utökad till alla 26 kurerade städer.

## HUMAN-CHECKLIST (efter deploy)
- [ ] GSC: kör "Validera korrigering" på **404**-rapporten (förvaltar-länkarna är huvudkällan).
- [ ] GSC: bekräfta att **noindex** (356) förblir avsiktliga `/sok`-varianter — ingen åtgärd, validera vid behov.
- [ ] GSC: validera **"Dubblett utan kanonisk"** (14) efter att `/claima`-canonical indexerats.
- [ ] Spot-checka några live `/brf/...`-sidor: förvaltarlänken (om den visas) ska ge 200.
