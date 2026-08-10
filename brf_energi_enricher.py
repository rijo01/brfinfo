#!/usr/bin/env python3
"""
BRF Energi Enricher — matchar BRF:er mot Boverkets publika API för
energideklarationer och skriver resultatet till tabellen `energideklarationer`.

VALIDERINGS-MVP (FAS 2): kör på ETT pilot-urval (default Stockholm kommun),
INTE hela registret. Primär output = MATCH-RATE.

Matchningsstrategi (prioritetsordning):
  1) kommun + fastighetsbeteckning   -- EJ tillgänglig: foretag saknar beteckning (0% täckning)
  2) kommun + adress                 -- enda farbara vägen med nuvarande data

Adresser som är förvaltar-/postboxadresser (Box, NABO, FE, Kundnummer, c/o ...)
kan inte matcha en byggnad och klassas som 'ej_matchbar_adress' (ingen API-träff loggas).

Boverket-API (BEKRÄFTAT KONTRAKT):
  GET https://api.boverket.se/energideklarationer/?kommun={K}&adress={A}
  Auth: Azure API Management subscription-key. Standardheader 'Ocp-Apim-Subscription-Key'
        (override med BOVERKET_AUTH_HEADER om portalen anger annat namn).
  Rate limit: max 10 anrop/2s, 1500/dag, 40 000 KB/dag. Servicefönster 06:00–06:15.

Idempotent: hoppar över BRF:er som redan finns i `energideklarationer` (resumable).
            Kör med --force för att radera och ombearbeta.

DRY RUN: om BOVERKET_SUBSCRIPTION_KEY saknas körs ingen API-trafik — scriptet
         klassar adresser och rapporterar förväntad matchbar andel. Kör så här
         redan nu för att validera pipelinen innan Boverket-nyckeln finns.

Inga hemligheter i koden — allt läses från miljövariabler (se .env.local.example).
"""

import json
import os
import re
import sys
import time
import signal
import logging
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote
from urllib.error import HTTPError, URLError

# ── Config (miljövariabler — INGA hårdkodade hemligheter) ────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mtozvblwsahzijmpdmfs.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

BOVERKET_API_BASE   = os.environ.get("BOVERKET_API_BASE", "https://api.boverket.se/energideklarationer/")
BOVERKET_KEY        = os.environ.get("BOVERKET_SUBSCRIPTION_KEY", "")
BOVERKET_AUTH_HEADER = os.environ.get("BOVERKET_AUTH_HEADER", "Ocp-Apim-Subscription-Key")

PILOT_KOMMUN = os.environ.get("PILOT_KOMMUN", "Stockholm")
PILOT_LIMIT  = int(os.environ.get("PILOT_LIMIT", "0"))  # 0 = alla i kommunen

# Rate limiting: max 10 anrop / 2 s  →  minst 0.2 s mellan anrop (vi tar 0.22 för marginal)
MIN_INTERVAL = float(os.environ.get("BOVERKET_MIN_INTERVAL", "0.22"))
DAILY_CAP    = int(os.environ.get("BOVERKET_DAILY_CAP", "1500"))

BATCH_SIZE = 1000
LOG_FILE = "brf_energi_enricher.log"

FORCE = "--force" in sys.argv

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()],
)
log = logging.getLogger(__name__)

# ── Graceful shutdown ─────────────────────────────────────────────────────────
shutdown_requested = False
def handle_signal(signum, frame):
    global shutdown_requested
    shutdown_requested = True
    log.info("Shutdown begärd, avslutar efter aktuell BRF...")
signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

# ── HTTP-helpers (stdlib, samma stil som projektets övriga scripts) ───────────
def http_request(url, method="GET", data=None, headers=None, timeout=30):
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    req = Request(url, data=body, method=method, headers=headers)
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else None

def supabase_headers(extra=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h

# ── Adressklassning ────────────────────────────────────────────────────────────
# Mönster som indikerar en förvaltar-/post-/boxadress (ej byggnadsadress).
UNMATCHABLE_RE = re.compile(
    r"^\s*(box\b|c/o\b|nabo\b|fe\s*\d|fack\b|kundnummer\b|pl\s|pack\b)",
    re.IGNORECASE,
)
# Plocka bort ev. radnummer/lägenhetsnr-svans efter gatuadress för renare träff.
def clean_address(adress):
    """Returnerar (matchbar_adress | None, anledning)."""
    if not adress:
        return None, "saknar_adress"
    a = adress.strip()
    if UNMATCHABLE_RE.search(a):
        return None, "ej_matchbar_adress"
    # Ta bort ", postort"-svans och ev. "Box 843"-inslag mitt i strängen.
    if re.search(r"\bbox\b", a, re.IGNORECASE):
        return None, "ej_matchbar_adress"
    # Behåll gata + nummer; trimma komma-svansar.
    a = a.split(",")[0].strip()
    return (a or None), ("ok" if a else "saknar_adress")

# ── Parsning av Boverkets prismsträngar ("216 kWh/m² och år") → numeriskt ─────
def parse_number(s):
    if s is None:
        return None
    if isinstance(s, (int, float)):
        return float(s)
    m = re.search(r"(\d[\d\s]*(?:[.,]\d+)?)", str(s))
    if not m:
        return None
    num = m.group(1).replace(" ", "").replace("\xa0", "").replace(",", ".")
    try:
        return float(num)
    except ValueError:
        return None

def parse_year(s):
    if s is None:
        return None
    m = re.search(r"(\d{4})", str(s))
    return int(m.group(1)) if m else None

# ── Supabase: hämta pilot-BRF:er ──────────────────────────────────────────────
def fetch_pilot_brfs():
    brfs = []
    offset = 0
    while True:
        params = {
            "select": "orgnr,namn,adress,postort,kommun,lan",
            "juridisk_form": "eq.Bostadsrättsföreningar",
            "kommun": f"eq.{PILOT_KOMMUN}",
            "order": "rank_score.desc.nullslast",
            "limit": str(BATCH_SIZE),
            "offset": str(offset),
        }
        url = f"{SUPABASE_URL}/rest/v1/foretag?{urlencode(params, quote_via=quote)}"
        data = http_request(url, headers=supabase_headers())
        if not data:
            break
        brfs.extend(data)
        if len(data) < BATCH_SIZE:
            break
        offset += BATCH_SIZE
        if PILOT_LIMIT and len(brfs) >= PILOT_LIMIT:
            break
    if PILOT_LIMIT:
        brfs = brfs[:PILOT_LIMIT]
    return brfs

def already_processed_orgnrs():
    """Orgnr som redan finns i energideklarationer (för resumability)."""
    seen = set()
    offset = 0
    while True:
        # ORDER BY krävs för stabil offset-paginering. Utan order kör Postgres
        # parallell seq-scan vars radordning skiljer sig mellan range-requesten
        # → fönstren överlappar/hoppar → hål i "redan bearbetad"-mängden. Samma
        # fel är dokumenterat som verifierat i app/sitemap.ts. Hål här betyder
        # att redan klara BRF:er bearbetas om och krockar med de unika indexen.
        # orgnr är indexerat (energideklarationer_orgnr_idx), så sorten är billig.
        url = (f"{SUPABASE_URL}/rest/v1/energideklarationer"
               f"?select=orgnr&order=orgnr&limit={BATCH_SIZE}&offset={offset}")
        try:
            data = http_request(url, headers=supabase_headers())
        except HTTPError as e:
            if e.code == 404:
                log.error("Tabellen energideklarationer finns inte än — kör db/energi_schema.sql först.")
                sys.exit(1)
            raise
        if not data:
            break
        for r in data:
            seen.add(r["orgnr"])
        if len(data) < BATCH_SIZE:
            break
        offset += BATCH_SIZE
    return seen

def delete_for_orgnr(orgnr):
    url = f"{SUPABASE_URL}/rest/v1/energideklarationer?orgnr=eq.{orgnr}"
    http_request(url, method="DELETE", headers=supabase_headers({"Prefer": "return=minimal"}))

def insert_rows(rows):
    """Skriver deklarationsrader. Returnerar False om de redan fanns.

    Schemat har unika index (orgnr+boverket_id för träffar, orgnr för
    ingen-träff-rader) så att omkörning inte skapar dubbletter. Ett om-inlägg
    ger då 409 från PostgREST — vilket är idempotens, inte ett fel: raden finns
    redan. Utan den här hanteringen kastade urlopen HTTPError rakt ut ur
    huvudloopen och körningen dog mitt i, med förbrukad API-budget för dagen.
    """
    if not rows:
        return True
    url = f"{SUPABASE_URL}/rest/v1/energideklarationer"
    try:
        http_request(url, method="POST", data=rows,
                     headers=supabase_headers({"Prefer": "return=minimal"}))
        return True
    except HTTPError as e:
        if e.code == 409:
            log.warning("  409 — rad(er) fanns redan för orgnr %s, hoppar över.",
                        rows[0].get("orgnr"))
            return False
        raise

# ── Boverket-anrop ─────────────────────────────────────────────────────────────
def boverket_query(kommun, adress):
    qs = urlencode({"kommun": kommun, "adress": adress}, quote_via=quote)
    url = f"{BOVERKET_API_BASE}?{qs}"
    headers = {BOVERKET_AUTH_HEADER: BOVERKET_KEY, "Accept": "application/json"}
    return http_request(url, headers=headers, timeout=40)

def map_declaration(orgnr, kommun, decl, match_metod):
    fastigheter = decl.get("fastigheter") or []
    f0 = fastigheter[0] if fastigheter else {}
    adresser = (f0.get("adresser") or [])
    a0 = adresser[0] if adresser else {}
    return {
        "orgnr": orgnr,
        "fastighetsbeteckning": f0.get("fastighetsbeteckning"),
        "kommun": f0.get("kommun") or kommun,
        "adress": a0.get("adress"),
        "postnummer": a0.get("postnummer"),
        "postort": a0.get("postort"),
        "energiklass": decl.get("energiklass"),
        "boverket_id": str(decl.get("id")) if decl.get("id") is not None else None,
        "primarenergital_kwh": parse_number(decl.get("primarenergital")),
        "energiprestanda_kwh": parse_number(decl.get("energiprestanda")),
        "specifik_energianvandning_kwh": parse_number(decl.get("specifik energianvändning")
                                                       or decl.get("specifik_energianvandning")),
        "byggnadsar": parse_year(decl.get("byggnadsar")),
        "radonmatning": decl.get("radonmatning"),
        "ventilationskontroll": decl.get("ventilationskontroll"),
        "utford": decl.get("utford"),
        "raw": decl,                       # REN jsonb
        "matchad": True,
        "match_metod": match_metod,
    }

def ingen_traff_row(orgnr, kommun, adress, metod):
    return {
        "orgnr": orgnr, "kommun": kommun, "adress": adress,
        "raw": None, "matchad": False, "match_metod": metod,
    }

# ── Throttle ────────────────────────────────────────────────────────────────────
_last_call = [0.0]
def throttle():
    now = time.monotonic()
    wait = MIN_INTERVAL - (now - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    _last_call[0] = time.monotonic()

# ── Statistik-hjälp ──────────────────────────────────────────────────────────
def print_report(stats, klass_dist):
    log.info("=" * 64)
    log.info("ENRICHMENT-RAPPORT — pilot: %s", PILOT_KOMMUN)
    log.info("  BRF:er i pilot:            %d", stats["total"])
    log.info("  Bearbetade detta körning:  %d", stats["processed"])
    log.info("  Hoppade (redan klara):     %d", stats["skipped_done"])
    log.info("  Ej matchbar adress:        %d", stats["unmatchable"])
    log.info("  API-anrop:                 %d", stats["api_calls"])
    log.info("  MATCHADE BRF:er:           %d", stats["matched_brfs"])
    log.info("  Deklarationsrader skapade: %d", stats["decl_rows"])
    attempted = stats["processed"] - stats["unmatchable"]
    if attempted:
        log.info("  MATCH-RATE (av API-försök):     %.1f%% (%d/%d)",
                 100 * stats["matched_brfs"] / attempted, stats["matched_brfs"], attempted)
    if stats["processed"]:
        log.info("  MATCH-RATE (av alla bearbetade): %.1f%% (%d/%d)",
                 100 * stats["matched_brfs"] / stats["processed"], stats["matched_brfs"], stats["processed"])
    log.info("  -- per metod --")
    for metod, n in sorted(stats["by_method"].items()):
        log.info("     %-22s %d", metod, n)
    log.info("  -- energiklass-fördelning --")
    for klass in ["A0", "A", "B", "C", "D", "E", "F", "G"]:
        if klass_dist.get(klass):
            log.info("     %-3s %d", klass, klass_dist[klass])
    other = {k: v for k, v in klass_dist.items() if k not in ["A0","A","B","C","D","E","F","G"]}
    for k, v in other.items():
        log.info("     %-3s %d", k or "?", v)
    log.info("=" * 64)

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if not SUPABASE_KEY:
        log.error("SUPABASE_SERVICE_KEY saknas i miljön. Sätt den och kör igen.")
        sys.exit(1)

    dry_run = not BOVERKET_KEY
    if dry_run:
        log.info("⚠️  DRY RUN — BOVERKET_SUBSCRIPTION_KEY saknas. Ingen API-trafik görs.")
        log.info("    Rapporterar adress-matchbarhet. Sätt nyckeln för skarp körning.")

    log.info("Hämtar pilot-BRF:er för kommun=%s ...", PILOT_KOMMUN)
    brfs = fetch_pilot_brfs()
    log.info("  %d BRF:er i piloten.", len(brfs))

    done = set() if (dry_run or FORCE) else already_processed_orgnrs()
    if done:
        log.info("  %d redan bearbetade (hoppas över, resumable).", len(done))

    stats = {
        "total": len(brfs), "processed": 0, "skipped_done": 0, "unmatchable": 0,
        "api_calls": 0, "matched_brfs": 0, "decl_rows": 0, "by_method": {},
    }
    klass_dist = {}
    daily_calls = 0

    for i, brf in enumerate(brfs, 1):
        if shutdown_requested:
            log.info("Avbryter på begäran.")
            break
        orgnr = brf["orgnr"]
        if orgnr in done:
            stats["skipped_done"] += 1
            continue

        kommun = brf.get("kommun") or PILOT_KOMMUN
        adress, reason = clean_address(brf.get("adress"))

        # Prioritet 1 (kommun+beteckning) ej möjlig: ingen beteckning i foretag.
        if not adress:
            stats["unmatchable"] += 1
            stats["processed"] += 1
            stats["by_method"]["ej_matchbar_adress"] = stats["by_method"].get("ej_matchbar_adress", 0) + 1
            if not dry_run:
                if not FORCE:
                    pass
                else:
                    delete_for_orgnr(orgnr)
                insert_rows([ingen_traff_row(orgnr, kommun, brf.get("adress"), reason)])
            continue

        metod = "kommun+adress"

        if dry_run:
            stats["processed"] += 1
            stats["by_method"][metod] = stats["by_method"].get(metod, 0) + 1
            if i <= 20:
                log.info("  [dry] %s | %s, %s", brf["namn"][:40], adress, kommun)
            continue

        if daily_calls >= DAILY_CAP:
            log.warning("Daglig API-gräns (%d) nådd. Stoppar — kör igen imorgon (resumable).", DAILY_CAP)
            break

        throttle()
        try:
            resp = boverket_query(kommun, adress)
            stats["api_calls"] += 1
            daily_calls += 1
        except HTTPError as e:
            if e.code == 429:
                log.warning("429 rate limit — väntar 5 s och försöker igen.")
                time.sleep(5)
                try:
                    resp = boverket_query(kommun, adress)
                    stats["api_calls"] += 1
                    daily_calls += 1
                except Exception as e2:
                    log.error("  fel igen för %s: %s", orgnr, e2)
                    continue
            elif e.code in (401, 403):
                log.error("Auth-fel (%d). Kontrollera BOVERKET_SUBSCRIPTION_KEY/-AUTH_HEADER. Avbryter.", e.code)
                break
            else:
                log.error("  HTTP %d för %s (%s)", e.code, orgnr, adress)
                resp = None
        except URLError as e:
            log.error("  nätfel för %s: %s", orgnr, e)
            continue

        stats["processed"] += 1
        decls = (resp or {}).get("energideklarationer") or []

        if FORCE:
            delete_for_orgnr(orgnr)

        if decls:
            rows = [map_declaration(orgnr, kommun, d, metod) for d in decls]
            insert_rows(rows)
            stats["matched_brfs"] += 1
            stats["decl_rows"] += len(rows)
            stats["by_method"][metod] = stats["by_method"].get(metod, 0) + 1
            for r in rows:
                k = r.get("energiklass") or "?"
                klass_dist[k] = klass_dist.get(k, 0) + 1
            log.info("  ✓ %s — %d deklaration(er), klass %s",
                     brf["namn"][:36], len(rows),
                     ",".join(sorted({r.get("energiklass") or "?" for r in rows})))
        else:
            insert_rows([ingen_traff_row(orgnr, kommun, adress, "ingen_traff")])
            stats["by_method"]["ingen_traff"] = stats["by_method"].get("ingen_traff", 0) + 1

        if i % 50 == 0:
            log.info("... %d/%d bearbetade, %d matchade, %d API-anrop",
                     i, len(brfs), stats["matched_brfs"], stats["api_calls"])

    print_report(stats, klass_dist)

if __name__ == "__main__":
    main()
