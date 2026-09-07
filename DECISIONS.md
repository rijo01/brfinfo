# DECISIONS — brfinfo.se

Beslutslogg för det här repot. Ett beslut skrivs in här när det är sådant att en
framtida ändring annars river upp det av misstag. Varje post har ett eget id
(`BD-n`) som commit-meddelanden får referera till med raden `Ref: BD-n`.

> **Referenser pekar bara hit.** `Ref:`-rader i brfinfos commitar får aldrig peka
> på ett annat repos beslutslogg — en sådan referens går inte att slå upp för den
> som läser historiken här, och ser ut att vara belagd fastän den inte är det.
> Se BD-3.

---

## BD-1 — Verifiering sker mot avläst produktion efter framtvingad omdeploy, alltid med negativkontroll

**Beslut.** En ändring räknas som verifierad först när den är **avläst i
produktion** (`https://brfinfo.se`), efter en **framtvingad omdeploy**, och
avläsningen har åtföljts av en **negativkontroll**.

De tre leden, och varför vart och ett behövs:

1. **Avläst produktion.** Inte lokalt bygge, inte preview-URL, inte "borde
   fungera". Det som räknas är svaret från den URL en användare och Googlebot
   faktiskt träffar. Lokalt bygge och produktion skiljer sig på miljövariabler,
   datacache och ISR — de tre ställen där den här sajten historiskt gått sönder.

2. **Framtvingad omdeploy.** Utan den vet man inte om man läser den nya koden.
   Next Data Cache håller förvaltarindexet i 24 h, ISR serverar färdiga sidor,
   och CDN:en svarar från kant. En avläsning som råkar träffa gammal cache ser
   likadan ut som en avläsning av en ändring som inte gick igenom. Tvinga fram
   deployen (ny deploy utan build-cache, eller invalidera taggen) och läs sedan.

3. **Negativkontroll.** Läs också av något som **ska** ge motsatt utfall —
   en URL som ska 404:a, ett fält som ska vara tomt, en sträng som ska vara
   borta. En kontroll som inte kan falla mäter ingenting. Det var precis så
   förvaltarindexet kunde vara tomt i en vecka: sajten svarade 200, kontrollen
   var "svarar sidan?", och svaret var ja hela tiden — med "0 förvaltningsbolag"
   på sidan.

**Varför.** Alla tre större incidenterna i det här repot har samma form: något
verifierades i ett led som inte var produktion, eller med en kontroll som inte
kunde ge fel svar. 1 107 förvaltar-URL:er som 404:ade i tysthet, 24 av 27 loggade
`/brf`-404:or som svarade 200 vid direkt kontroll, "Från Bolagsverket"-rubriken
som renderades tom på 29 404 sidor. Inget av det hade överlevt en avläsning av
produktion med en negativkontroll bredvid.

**Konsekvens i koden.** Invarianten `granskaForvaltarindex()` i `lib/supabase.ts`
och golden-testerna mot falska 404:or är den automatiserade halvan av samma
regel: de faller hellre bygget än släpper igenom ett tomt index. Regeln här är
den manuella halvan — den gäller varje leverans, även den som inte har ett test.

---

## BD-2 — Avsändaruppgifter hittas aldrig på; tomma fält renderas inte

**Beslut.** Utgivarens identitetsuppgifter (namn, organisationsnummer) i
`lib/bolag.ts` slås upp i vår egen Supabase eller i primärkälla, aldrig gissas
eller härleds ur ett namn. Ett fält som saknar belagt värde lämnas tomt, och
`/om` och sidfoten renderar inte fältet alls medan det är tomt.

**Varför.** Sajten säljer registerdata och en handbok. Ett påhittat
organisationsnummer på avsändaren är samma sorts fel som ett påhittat
organisationsnummer på en förening — men värre, eftersom det är den uppgift
läsaren ska kunna använda för att kontrollera oss. Ett tomt fält är ärligt;
ett fel fält är inte det.

---

## BD-3 — `Ref:`-rader pekar bara på det här repots beslutslogg

**Beslut.** Commit-meddelanden i brfinfo refererar bara beslut som finns i det
här repots `DECISIONS.md`. En referens till en annan kodbas beslutslogg är ett
fel och tas bort eller ersätts med rätt `BD-n`.

**Varför.** `fd933da` bär raden `Ref: DE.47`, som pekade på ett ANNAT repos
beslutslogg. För den som läser brfinfos historik finns det inget att slå upp:
referensen ser ut att belägga ett beslut, men kan inte kontrolleras. Det är
samma fel som sajtens egna "obelagda löften" — ett påstående som utger sig för
att vara belagt.

**Rättelse.** `fd933da` var redan pushad till `origin/main`. Meddelandet skrivs
därför INTE om — historiken står kvar som den är, och rättelsen görs framåt:

- Raden `Ref: DE.47` i `fd933da` är ogiltig. Den avsåg ett annat repo och
  motsvarar inget beslut i brfinfo.
- En `git note` på `fd933da` säger samma sak intill commiten
  (`git log --notes` / `git notes show fd933da`).
- Besluten som commiten faktiskt vilar på är BD-2 (tomt org.nr renderas inte)
  och BD-1 (verifiering mot avläst produktion).

Att skriva om publicerad historik för att städa en meddelanderad är en dyrare
åtgärd än felet — det är felet som dokumenteras, inte döljs.
