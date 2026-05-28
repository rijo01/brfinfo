-- ============================================================================
-- brfinfo — Energideklarations-MVP: schema (FAS 1)
-- Kör i Supabase SQL-editor: https://supabase.com/dashboard/project/mtozvblwsahzijmpdmfs/sql
-- Idempotent: kan köras om utan fel.
--
-- HÅRD REGEL: rör ALDRIG källtabellen `foretag`. All ny data i egna tabeller.
-- ============================================================================

-- ── energideklarationer ─────────────────────────────────────────────────────
-- En rad per matchad (eller försökt-matchad) energideklaration för en BRF.
create table if not exists public.energideklarationer (
  id                          bigint generated always as identity primary key,
  orgnr                       text not null,
  fastighetsbeteckning        text,
  kommun                      text,
  adress                      text,
  postnummer                  text,
  postort                     text,
  energiklass                 text,           -- A0, A, B, C, D, E, F, G
  boverket_id                 text,           -- energideklarationer[].id från Boverket
  primarenergital_kwh         numeric,        -- parsat numeriskt ur prismsträng
  energiprestanda_kwh         numeric,
  specifik_energianvandning_kwh numeric,
  byggnadsar                  integer,
  radonmatning                text,
  ventilationskontroll        text,
  utford                      date,
  giltig_tom                  date generated always as (
                                (utford + interval '10 years')::date
                              ) stored,
  raw                         jsonb,          -- REN jsonb (ej dubbelkodad sträng)
  matchad                     boolean not null default false,
  match_metod                 text,           -- 'kommun+beteckning' | 'kommun+adress' | 'ingen_traff'
  skapad_at                   timestamptz not null default now()
);

-- En BRF kan ha flera deklarationer (flera byggnader). Dedupe på orgnr+boverket_id
-- så att omkörning av enrichern inte skapar dubbletter.
create unique index if not exists energideklarationer_orgnr_boverket_uniq
  on public.energideklarationer (orgnr, boverket_id)
  where boverket_id is not null;

-- För "ingen träff"-rader (boverket_id null): en rad per orgnr så idempotensen håller.
create unique index if not exists energideklarationer_orgnr_ingen_traff_uniq
  on public.energideklarationer (orgnr)
  where boverket_id is null;

create index if not exists energideklarationer_orgnr_idx       on public.energideklarationer (orgnr);
create index if not exists energideklarationer_kommun_idx      on public.energideklarationer (kommun);
create index if not exists energideklarationer_energiklass_idx on public.energideklarationer (energiklass);

-- ── energi_leads ─────────────────────────────────────────────────────────────
create table if not exists public.energi_leads (
  id              bigint generated always as identity primary key,
  orgnr           text,
  brf_namn        text,
  kommun          text,
  intresse        text,         -- solceller | varmepump | fonster | energikartlaggning | annat
  kontakt_email   text,
  kontakt_telefon text,
  meddelande      text,
  kalla           text,         -- t.ex. 'brf-sida' | 'energiklass-katalog'
  status          text not null default 'ny',  -- ny | kontaktad | kvalificerad | stangd
  skapad_at       timestamptz not null default now()
);

create index if not exists energi_leads_orgnr_idx  on public.energi_leads (orgnr);
create index if not exists energi_leads_kommun_idx  on public.energi_leads (kommun);
create index if not exists energi_leads_status_idx  on public.energi_leads (status);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.energideklarationer enable row level security;
alter table public.energi_leads        enable row level security;

-- energideklarationer: publik läsning (visas på SEO-sidor). Skrivning sker via
-- service_role (enrichment-script) som bypassar RLS.
drop policy if exists energideklarationer_public_read on public.energideklarationer;
create policy energideklarationer_public_read
  on public.energideklarationer for select
  to anon, authenticated
  using (true);

-- energi_leads: anon får ENDAST insert (lead-capture). Ingen publik läsning
-- (admin/stats läser via service_role som bypassar RLS).
drop policy if exists energi_leads_anon_insert on public.energi_leads;
create policy energi_leads_anon_insert
  on public.energi_leads for insert
  to anon, authenticated
  with check (true);

-- ============================================================================
-- Klart. Verifiera:
--   select count(*) from energideklarationer;
--   select count(*) from energi_leads;
-- ============================================================================
