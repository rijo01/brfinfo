# VALIDERING — Energideklarations-MVP (90 dagar)

Syfte: avgöra om det är värt att bygga vidare på energi-spåret. Vi mäter två saker:

1. **Datavaliditet** — kan vi matcha BRF → energideklaration tillförlitligt?
2. **Betal-intention** — finns efterfrågan (lead-konvertering) på energiåtgärder?

Startdatum: _fyll i när enrichern körts skarpt + sidorna är live._
Avläsning: dag 90.

---

## Vad vi mäter

### A. Matchning (datavaliditet)
| Mått | Källa | Var |
|---|---|---|
| Match-rate totalt (matchade / API-försök) | `energideklarationer` | `/admin/energi-stats` + enricher-loggen |
| Match-rate per metod | `match_metod`-kolumnen | samma |
| Energiklass-fördelning (A–G) | `energiklass` | samma |
| Andel ej matchbar adress | `match_metod = 'ej_matchbar_adress'` | samma |

> **Förutsättning (FAS 0):** `foretag` saknar fastighetsbeteckning helt (0 %). All matchning sker via **kommun + adress**. Av Stockholms 2 808 BRF:er har **1 567** en adress värd att fråga på; 1 241 har förvaltar-/boxadress och kan inte matchas. Den faktiska match-raten mäts mot de 1 567 vid skarp körning.

### B. Trafik & synlighet
| Mått | Källa |
|---|---|
| Organiska visningar/klick på `/energideklaration` och `/energiklass/[stad]` | Google Search Console |
| Organisk CTR för energi-sidorna | Search Console |
| Indexeringsstatus för nya sidor | Search Console |

### C. Lead-funnel (betal-intention)
GA4-event på brfinfo:s egen stream (`G-0281GKZT7X`):
| Event | När |
|---|---|
| `energi_cta_view` | CTA syns på BRF-sidan (40 % i viewport) |
| `energi_cta_click` | Användaren öppnar offertformuläret |
| `energi_lead_submit` | Formuläret skickas (lead sparad i `energi_leads`) |

Leads lagras i `energi_leads` (intresse, kommun, status). Inget externt utskick i MVP — vi mäter intention först. (Valfri Resend-notis om `RESEND_API_KEY` + `ENERGI_LEAD_NOTIFY_EMAIL` är satta.)

---

## Förslag på success-trösklar (90 dgr)

| Hypotes | Mått | Tröskel | Tolkning |
|---|---|---|---|
| H1: Vi kan matcha tillförlitligt | Match-rate (av API-försök) | **≥ 60 %** | ≥60 % → datan bär. 40–60 % → ok för utvalda städer. <40 % → adress-vägen för svag, kräver fastighetsbeteckning-källa. |
| H2: Sidorna syns organiskt | Search Console-visningar för energi-sidor | **mätbart >0 och stigande** | Visningar som växer m-ö-m → SEO-spåret lever. |
| H2b: Innehållet är relevant | Organisk CTR | **≥ 1 %** | I nivå med övriga register-sidor. |
| H3: Det finns intention | CTA-klick-rate (`cta_click` / `cta_view`) | **≥ 3 %** | Mäter om erbjudandet lockar. |
| H3b: Intentionen är kvalificerad | Kvalificerade leads | **≥ 10 / 90 dgr** | Konkret betal-signal. Justera mot pilotens storlek. |
| H3c: Funnel håller | Submit-rate (`lead_submit` / `cta_click`) | **≥ 20 %** | Mäter formulärfriktion. |

> Trösklarna är startvärden för en pilot i **en** stad. Justera när vi vet pilotens faktiska trafikvolym.

---

## Hur Rickard läser av det

1. **Match-rate & leads:** öppna `/admin/energi-stats?key=<ADMIN_STATS_KEY>`. Visar bearbetade/matchade BRF, match-rate per metod, energiklass-fördelning, antal leads per intresse/stad/status.
2. **Funnel (view → click → submit):** GA4 → Engagemang → Händelser → filtrera `energi_cta_view`, `energi_cta_click`, `energi_lead_submit`. Bygg en tratt-utforskning på de tre.
3. **SEO:** Search Console → Resultat → filtrera sidor som innehåller `/energideklaration` och `/energiklass/`. Följ visningar, klick, CTR, snittposition över 90 dagar.
4. **Råa leads:** Supabase → tabell `energi_leads` (kontaktuppgifter, för uppföljning).

### Beslut dag 90
- **Bygg vidare** om H1 ≥ 60 % **och** (H3 ≥ 3 % **eller** ≥ 10 kvalificerade leads).
- **Justera & förläng** om match-rate är ok men leads svaga (testa erbjudande/copy), eller tvärtom.
- **Lägg ner energi-spåret** om både match-rate < 40 % och CTA-klick-rate < 1 %.

---

## Mätnings-checklista (innan start)
- [ ] `db/energi_schema.sql` körd i Supabase.
- [ ] Boverket-avtal tecknat (gratis) + subscription-nyckel mottagen via mejl.
- [ ] `BOVERKET_SUBSCRIPTION_KEY` satt → `python3 brf_energi_enricher.py` körd skarpt för Stockholm.
- [ ] `ADMIN_STATS_KEY` + `SUPABASE_SERVICE_ROLE_KEY` satta i Vercel (för `/admin/energi-stats`).
- [ ] GA4-eventen syns i DebugView efter ett testbesök.
- [ ] Nya sidor inskickade i Search Console (sitemap inkluderar dem).
