-- ============================================================================
-- brfinfo — brf_webb: verifierade föreningshemsidor + publika årsredovisningar
--
-- Projekt: mtozvblwsahzijmpdmfs (samma instans som foretag, fk_*, campingar …)
-- Kör i SQL Editor: https://supabase.com/dashboard/project/mtozvblwsahzijmpdmfs/sql
--
-- HÅRD REGEL: `foretag` RÖRS ALDRIG. Ingen ALTER, ingen INSERT, ingen UPDATE,
-- inget index, ingen foreign key. Kopplingen är orgnr som ren text — samma
-- mönster som brf_utskick och campingar/akeriguiden.
--
-- Namnkontroll före körning (lärdomen från `claims`, se db/utskick_schema.sql):
--   select table_name from information_schema.tables
--   where table_schema='public' and table_name like '%webb%';
--   → gav NOLL rader 2026-09-02. `brf_webb` är ledigt. Kör man create table
--     if not exists mot ett upptaget namn blir det en TYST no-op och skriptet
--     skriver sedan in brfinfo-data i någon annan sajts tabell.
--
-- Blocken är idempotenta och körs i ordning.
-- ============================================================================


-- ============================================================================
-- BLOCK 1 — tabell
-- ============================================================================

create table if not exists public.brf_webb (
  orgnr                   text primary key,   -- unik per förening; ingen FK mot foretag

  -- ── Hemsidan ──────────────────────────────────────────────────────────────
  hemsida_url             text,               -- slutlig URL efter redirects, alltid absolut
  hemsida_status          text,               -- 'ok' | 'redirect' | 'dod' | 'portal'
  hemsida_verifierad_at   timestamptz,        -- när identiteten senast bekräftades

  -- ── Årsredovisningen ──────────────────────────────────────────────────────
  -- URL till SIDAN där dokumentet ligger, inte till PDF:en. Vi länkar till
  -- föreningens egen dokumentsida så att besökaren ser den i sitt sammanhang
  -- och föreningen får trafiken. Ingen PDF sparas, inga siffror extraheras.
  arsredovisning_url      text,
  arsredovisning_hittad_at timestamptz,

  -- ── Spårbarhet ────────────────────────────────────────────────────────────
  robots_blockerad        boolean not null default false,  -- robots.txt sa nej → vi slutade
  kalla                   text not null,      -- 'crawl' | 'claim'

  -- Extra kolumn utanför specen, medvetet tillagd: utan den går det inte att i
  -- efterhand skilja en URL som stod i foretag.hemsida från en som härleddes ur
  -- föreningens e-postdomän. Den skillnaden avgör hur mycket man får lita på
  -- raden, och den måste gå att revidera i efterhand.
  url_ursprung            text,               -- 'hemsida-falt' | 'epost-doman' | 'claim'

  skapad_at               timestamptz not null default now(),
  uppdaterad_at           timestamptz not null default now()
);

comment on table public.brf_webb is
  'Verifierade föreningshemsidor och publika årsredovisningssidor. Endast URL:er och tidsstämplar — aldrig dokument, siffror eller personuppgifter. Källtabellen foretag rörs aldrig.';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'brf_webb_hemsida_status_chk') then
    alter table public.brf_webb add constraint brf_webb_hemsida_status_chk
      check (hemsida_status is null or hemsida_status in ('ok','redirect','dod','portal'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brf_webb_kalla_chk') then
    alter table public.brf_webb add constraint brf_webb_kalla_chk
      check (kalla in ('crawl','claim'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brf_webb_url_ursprung_chk') then
    alter table public.brf_webb add constraint brf_webb_url_ursprung_chk
      check (url_ursprung is null or url_ursprung in ('hemsida-falt','epost-doman','claim'));
  end if;
  -- En verifieringstidsstämpel utan URL är meningslös, och en URL utan status
  -- kan inte visas. Håll ihop paren i databasen i stället för i klientkoden.
  if not exists (select 1 from pg_constraint where conname = 'brf_webb_hemsida_par_chk') then
    alter table public.brf_webb add constraint brf_webb_hemsida_par_chk
      check (hemsida_url is null or hemsida_status is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brf_webb_ar_par_chk') then
    alter table public.brf_webb add constraint brf_webb_ar_par_chk
      check (arsredovisning_url is null or arsredovisning_hittad_at is not null);
  end if;
end $$;

-- Sidvisningen läser hela den publika delen i ETT svep och cachar den (se
-- lib/webb.ts). Partiellt index på precis det urvalet.
create index if not exists brf_webb_publik_idx
  on public.brf_webb (orgnr)
  where hemsida_status in ('ok','redirect');

-- Batchen frågar "vilka har jag inte verifierat på 90 dagar?"
create index if not exists brf_webb_verifierad_idx on public.brf_webb (hemsida_verifierad_at);
create index if not exists brf_webb_status_idx     on public.brf_webb (hemsida_status);


-- ============================================================================
-- BLOCK 2 — uppdaterad_at
-- ============================================================================

create or replace function public.brf_webb_touch() returns trigger
language plpgsql as $$
begin
  new.uppdaterad_at := now();
  return new;
end $$;

drop trigger if exists brf_webb_touch_trg on public.brf_webb;
create trigger brf_webb_touch_trg
  before update on public.brf_webb
  for each row execute function public.brf_webb_touch();


-- ============================================================================
-- BLOCK 3 — RLS
--
-- Till skillnad från brf_utskick (helt stängd) SKA den här tabellen läsas av
-- anon: sajten renderar med anon-nyckeln (lib/supabase.ts), och länkarna visas
-- publikt. Men bara URL-fälten är publika.
--
-- RLS är radnivå och kan inte begränsa kolumner. Kolumnskyddet görs därför med
-- GRANT på kolumnnivå — Postgres stödjer det, och PostgREST respekterar det.
-- Supabase delar som standard ut SELECT på hela tabellen till anon via default
-- privileges, så vi måste dra in dem först. Ordningen spelar roll.
-- ============================================================================

alter table public.brf_webb enable row level security;

-- 1. Dra in allt som default privileges delade ut.
revoke all on public.brf_webb from anon, authenticated;

-- 2. Dela ut igen — men bara de sex kolumner som faktiskt renderas.
--    robots_blockerad, kalla, url_ursprung, skapad_at och uppdaterad_at är
--    interna och ligger medvetet utanför.
grant select (
  orgnr,
  hemsida_url,
  hemsida_status,
  hemsida_verifierad_at,
  arsredovisning_url,
  arsredovisning_hittad_at
) on public.brf_webb to anon, authenticated;

-- 3. Radfilter: bara rader vi faktiskt skulle visa lämnar databasen.
--    En förening vi klassat som 'dod' eller 'portal' ska inte gå att läsa ut
--    via API:et heller — den informationen är vår interna bedömning, inte
--    något föreningen bett oss publicera.
drop policy if exists "anon laser verifierade webblankar" on public.brf_webb;
create policy "anon laser verifierade webblankar"
  on public.brf_webb for select
  to anon, authenticated
  using (hemsida_status in ('ok','redirect'));

-- Ingen insert/update/delete-policy. Det är avsikten, inte en glömska:
-- service_role bypassar RLS och är enda vägen in. Batchen och en framtida
-- claim-route kör med service role på servern.


-- ============================================================================
-- BLOCK 4 — verifiering. Kör detta EFTER batchen, före publicering.
-- ============================================================================

-- 1. Hur många rader, per status?
--    select hemsida_status, count(*) from brf_webb group by 1 order by 2 desc;

-- 2. Hur många får vi faktiskt visa?
--    select count(*) from brf_webb where hemsida_status in ('ok','redirect');

-- 3. Hur många har en årsredovisningslänk?
--    select count(*) from brf_webb where arsredovisning_url is not null;

-- 4. Ligger någon URL på en förvaltardomän trots status 'ok'? Ska ge NOLL rader.
--    select orgnr, hemsida_url from brf_webb
--    where hemsida_status in ('ok','redirect')
--      and hemsida_url ~* '(hsb\.se|riksbyggen\.se|sbc\.se|bblick\.se|nabo\.se|fastum\.se|mbf\.se|egeryds\.se|bostadsratterna\.se)';

-- 5. Blev någon rad kvar med robots_blockerad = true och ändå publik status?
--    Ska ge NOLL rader — vi publicerar inte länkar vi inte fick hämta.
--    select orgnr, hemsida_url from brf_webb
--    where robots_blockerad = true and hemsida_status in ('ok','redirect');

-- 6. Kontrollera kolumnrättigheterna (kör som anon, t.ex. via curl med anon-nyckeln):
--    select * from brf_webb limit 1;              -- ska FELA: permission denied
--    select orgnr, hemsida_url from brf_webb limit 1;  -- ska fungera

-- 7. Föreningar som ska omverifieras (äldre än 90 dagar):
--    select count(*) from brf_webb where hemsida_verifierad_at < now() - interval '90 days';
