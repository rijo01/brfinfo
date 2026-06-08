#!/usr/bin/env python3
"""
BRF Enricher - Fetches data from Bolagsverket's Värdefulla Datamängder API
and enriches BRF records in Supabase.

Rate limit: 55 requests/minute (API limit is 60/min).
Resumable: tracks progress via bolagsverket_uppdaterad column.
"""

import json
import time
import logging
import signal
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote
from urllib.error import HTTPError, URLError

# ── Config ──────────────────────────────────────────────────────────────────
BV_CLIENT_ID = "XHBDphflRmIkOuV9JU76nOOZ0V8a"
BV_CLIENT_SECRET = "C_ffY_rW0pKEfjpUTV0xCqYGfCEa"
BV_TOKEN_URL = "https://portal.api.bolagsverket.se/oauth2/token"
BV_API_BASE = "https://gw.api.bolagsverket.se/vardefulla-datamangder/v1"

SUPABASE_URL = "https://mtozvblwsahzijmpdmfs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b3p2Ymx3c2FoemlqbXBkbWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4NjM1OCwiZXhwIjoyMDg3ODYyMzU4fQ.7SPPGBb4NMP0I8RIqMyAcN10HOIn-Gj9QGWvJ3j24b0"

RATE_LIMIT = 55  # requests per minute
BATCH_SIZE = 1000  # Supabase pagination
LOG_FILE = "brf_enricher.log"

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ── Graceful shutdown ───────────────────────────────────────────────────────
shutdown_requested = False

def handle_signal(signum, frame):
    global shutdown_requested
    shutdown_requested = True
    log.info("Shutdown requested, finishing current request...")

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

# ── HTTP helpers ────────────────────────────────────────────────────────────
def http_request(url, method="GET", data=None, headers=None, timeout=30):
    """Simple HTTP request using stdlib."""
    if headers is None:
        headers = {}
    body = None
    if data is not None:
        if isinstance(data, dict):
            body = json.dumps(data).encode("utf-8")
        elif isinstance(data, str):
            body = data.encode("utf-8")
        elif isinstance(data, bytes):
            body = data
    req = Request(url, data=body, headers=headers, method=method)
    resp = urlopen(req, timeout=timeout)
    return json.loads(resp.read().decode("utf-8"))


# ── Bolagsverket token ──────────────────────────────────────────────────────
_token_cache = {"token": None, "expires_at": 0}

def get_bv_token():
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    log.info("Refreshing Bolagsverket OAuth token...")
    body = urlencode({
        "grant_type": "client_credentials",
        "client_id": BV_CLIENT_ID,
        "client_secret": BV_CLIENT_SECRET,
        "scope": "vardefulla-datamangder:read",
    }).encode("utf-8")
    req = Request(BV_TOKEN_URL, data=body, headers={
        "Content-Type": "application/x-www-form-urlencoded",
    }, method="POST")
    resp = json.loads(urlopen(req, timeout=30).read().decode("utf-8"))
    _token_cache["token"] = resp["access_token"]
    _token_cache["expires_at"] = now + resp["expires_in"]
    return _token_cache["token"]


# ── Bolagsverket API ────────────────────────────────────────────────────────
def fetch_org_data(orgnr):
    token = get_bv_token()
    return http_request(
        f"{BV_API_BASE}/organisationer",
        method="POST",
        data={"identitetsbeteckning": orgnr},
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        timeout=30,
    )


# ── Supabase helpers ────────────────────────────────────────────────────────
def supabase_headers(extra=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def fetch_brfs_to_process():
    """Fetch all BRFs that haven't been enriched yet."""
    all_brfs = []
    offset = 0
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/foretag"
            f"?select=orgnr,namn"
            f"&juridisk_form=eq.Bostadsr%C3%A4ttsf%C3%B6reningar"
            f"&bolagsverket_uppdaterad=is.null"
            f"&order=orgnr"
            f"&limit={BATCH_SIZE}&offset={offset}"
        )
        data = http_request(url, headers=supabase_headers())
        if not data:
            break
        all_brfs.extend(data)
        offset += len(data)
        if len(data) < BATCH_SIZE:
            break
    return all_brfs


def update_brf(orgnr, update_data):
    """Update a BRF record in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/foretag?orgnr=eq.{orgnr}"
    body = json.dumps(update_data).encode("utf-8")
    req = Request(url, data=body, headers=supabase_headers({
        "Prefer": "return=minimal",
    }), method="PATCH")
    urlopen(req, timeout=30)


# ── Data extraction ─────────────────────────────────────────────────────────
def extract_enrichment(api_response):
    """Extract relevant fields from Bolagsverket API response."""
    orgs = api_response.get("organisationer", [])
    if not orgs:
        return None

    org = orgs[0]
    result = {}

    # Verksamhetsbeskrivning
    vb = org.get("verksamhetsbeskrivning")
    if vb and vb.get("beskrivning"):
        result["verksamhetsbeskrivning"] = vb["beskrivning"]

    # Postadress
    pa = org.get("postadressOrganisation")
    if pa and pa.get("postadress"):
        addr = pa["postadress"]
        parts = []
        if addr.get("utdelningsadress"):
            parts.append(addr["utdelningsadress"])
        if addr.get("postnummer") and addr.get("postort"):
            parts.append(f"{addr['postnummer']} {addr['postort']}")
        if parts:
            result["adress_bv"] = ", ".join(parts)
        result["postadress_detaljer"] = addr

    # Status (verksam/ej verksam)
    vo = org.get("verksamOrganisation")
    if vo:
        result["verksam"] = vo.get("kod")

    # Avregistrering
    avr = org.get("avregistreradOrganisation")
    if avr and avr.get("avregistreringsdatum"):
        result["avregistrerad"] = avr["avregistreringsdatum"]

    avro = org.get("avregistreringsorsak")
    if avro:
        result["avregistreringsorsak"] = avro.get("klartext")

    # Organisationsdatum
    od = org.get("organisationsdatum")
    if od and od.get("registreringsdatum"):
        result["registreringsdatum_bv"] = od["registreringsdatum"]

    # SNI-koder
    ng = org.get("naringsgrenOrganisation")
    if ng and ng.get("sni"):
        sni_list = [
            {"kod": s["kod"].strip(), "klartext": s["klartext"].strip()}
            for s in ng["sni"]
            if s.get("kod", "").strip()
        ]
        if sni_list:
            result["sni_koder"] = sni_list

    # Organisationsnamn
    on = org.get("organisationsnamn")
    if on and on.get("organisationsnamnLista"):
        result["namn_bv"] = on["organisationsnamnLista"]

    # Pågående avveckling
    paa = org.get("pagaendeAvvecklingsEllerOmstruktureringsforfarande")
    if paa and paa.get("pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista"):
        result["pagaende_avveckling"] = paa["pagaendeAvvecklingsEllerOmstruktureringsforfarandeLista"]

    return result


# ── Main loop ───────────────────────────────────────────────────────────────
def main():
    log.info("Starting BRF enrichment...")

    # Fetch BRFs to process
    brfs = fetch_brfs_to_process()
    total = len(brfs)
    log.info(f"Found {total} BRFs to process (not yet enriched)")

    if total == 0:
        log.info("Nothing to do, all BRFs already enriched.")
        return

    success = 0
    errors = 0
    skipped = 0
    start_time = time.time()
    minute_start = time.time()
    minute_count = 0

    for i, brf in enumerate(brfs):
        if shutdown_requested:
            log.info(f"Shutting down gracefully. Processed {i}/{total}")
            break

        orgnr = brf["orgnr"]

        # Rate limiting: 55 per minute
        minute_count += 1
        if minute_count >= RATE_LIMIT:
            elapsed = time.time() - minute_start
            if elapsed < 60:
                sleep_time = 60 - elapsed + 0.5
                log.info(f"Rate limit: sleeping {sleep_time:.1f}s")
                time.sleep(sleep_time)
            minute_start = time.time()
            minute_count = 0

        try:
            api_data = fetch_org_data(orgnr)
            enrichment = extract_enrichment(api_data)

            now = datetime.now(timezone.utc).isoformat()

            if enrichment:
                update = {
                    "bolagsverket_data": json.dumps(enrichment, ensure_ascii=False),
                    "bolagsverket_uppdaterad": now,
                }

                # Update adress if we got one from BV
                if enrichment.get("adress_bv"):
                    addr = enrichment.get("postadress_detaljer", {})
                    if addr.get("utdelningsadress"):
                        update["adress"] = addr["utdelningsadress"]
                    if addr.get("postort"):
                        update["postort"] = addr["postort"]

                # Update status based on verksam
                if enrichment.get("verksam") == "NEJ" or enrichment.get("avregistrerad"):
                    update["status"] = "Ej verksam"

                update_brf(orgnr, update)
                success += 1
            else:
                # Mark as processed even if no data
                update_brf(orgnr, {
                    "bolagsverket_data": json.dumps({"error": "no_data"}),
                    "bolagsverket_uppdaterad": now,
                })
                skipped += 1

        except HTTPError as e:
            errors += 1
            error_body = ""
            try:
                error_body = e.read().decode("utf-8")
            except Exception:
                pass
            log.error(f"HTTP {e.code} for {orgnr}: {error_body}")

            if e.code == 429:
                log.warning("Rate limited! Sleeping 120s...")
                time.sleep(120)
                minute_start = time.time()
                minute_count = 0

        except Exception as e:
            errors += 1
            log.error(f"Error for {orgnr} ({brf['namn']}): {e}")

        # Progress logging every 100
        if (i + 1) % 100 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / (elapsed / 60)
            eta_min = (total - i - 1) / rate if rate > 0 else 0
            log.info(
                f"Progress: {i+1}/{total} "
                f"({(i+1)/total*100:.1f}%) | "
                f"OK={success} ERR={errors} SKIP={skipped} | "
                f"{rate:.0f}/min | ETA: {eta_min:.0f}min"
            )

    elapsed = time.time() - start_time
    log.info(
        f"Done! Processed {success + errors + skipped}/{total} | "
        f"OK={success} ERR={errors} SKIP={skipped} | "
        f"Time: {elapsed/60:.1f}min"
    )


if __name__ == "__main__":
    main()
