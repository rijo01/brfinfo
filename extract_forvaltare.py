#!/usr/bin/env python3
"""
Extract förvaltare (management company) from bolagsverket_data.postadress_detaljer.coAdress
and save to a new 'forvaltare' column in the foretag table.
"""

import json
import time
import logging
import re
from urllib.request import Request, urlopen

# ── Config ──────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://mtozvblwsahzijmpdmfs.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b3p2Ymx3c2FoemlqbXBkbWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4NjM1OCwiZXhwIjoyMDg3ODYyMzU4fQ.7SPPGBb4NMP0I8RIqMyAcN10HOIn-Gj9QGWvJ3j24b0"

BATCH_SIZE = 500

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()],
)
log = logging.getLogger(__name__)


def supabase_headers(extra=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def http_request(url, method="GET", data=None, headers=None, timeout=30):
    body = None
    if data is not None:
        if isinstance(data, dict):
            body = json.dumps(data).encode("utf-8")
        elif isinstance(data, str):
            body = data.encode("utf-8")
        elif isinstance(data, bytes):
            body = data
    req = Request(url, data=body, headers=headers or {}, method=method)
    resp = urlopen(req, timeout=timeout)
    raw = resp.read().decode("utf-8")
    if not raw.strip():
        return None
    return json.loads(raw)


def run_sql(sql):
    """Run SQL via Supabase RPC (pg function) or REST."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    try:
        return http_request(url, method="POST", data={"query": sql}, headers=supabase_headers())
    except Exception:
        # If the RPC doesn't exist, we'll use an alternative approach
        return None


def add_column_if_missing():
    """Add 'forvaltare' column to foretag table if it doesn't exist."""
    # Try to read a record selecting the forvaltare column
    url = f"{SUPABASE_URL}/rest/v1/foretag?select=forvaltare&limit=1"
    try:
        http_request(url, headers=supabase_headers())
        log.info("Column 'forvaltare' already exists.")
        return True
    except Exception as e:
        error_str = str(e)
        if "400" in error_str or "column" in error_str.lower():
            log.info("Column 'forvaltare' does not exist. Please run this SQL in Supabase Dashboard:")
            log.info("  ALTER TABLE foretag ADD COLUMN IF NOT EXISTS forvaltare TEXT;")
            log.info("  CREATE INDEX IF NOT EXISTS idx_foretag_forvaltare ON foretag (forvaltare);")
            return False
        raise


def slugify(name):
    """Create a URL-safe slug from a name."""
    s = name.lower().strip()
    s = s.replace("å", "a").replace("ä", "a").replace("ö", "o")
    s = s.replace("é", "e").replace("ü", "u")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s


def fetch_and_process_brfs(update_callback):
    """Fetch BRFs in pages of BATCH_SIZE rows and process each page immediately.

    bolagsverket_data is stored as TEXT (not JSONB), so we must fetch it and
    parse in Python. Pagination keeps each request small enough to avoid 500s.
    """
    offset = 0
    total_fetched = 0
    updated = 0
    skipped = 0
    forvaltare_counts = {}

    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/foretag"
            f"?select=orgnr,bolagsverket_data"
            f"&juridisk_form=eq.Bostadsr%C3%A4ttsf%C3%B6reningar"
            f"&bolagsverket_data=not.is.null"
            f"&order=orgnr"
            f"&limit={BATCH_SIZE}&offset={offset}"
        )
        data = http_request(url, headers=supabase_headers(), timeout=120)
        if not data:
            break
        total_fetched += len(data)
        log.info(f"Fetched page at offset {offset}: {len(data)} rows (total: {total_fetched})")

        for brf in data:
            bv_data = brf.get("bolagsverket_data")
            if isinstance(bv_data, str):
                try:
                    bv_data = json.loads(bv_data)
                except Exception:
                    skipped += 1
                    continue
            co = extract_coadress(bv_data)
            if co:
                try:
                    update_forvaltare(brf["orgnr"], co)
                    updated += 1
                    forvaltare_counts[co] = forvaltare_counts.get(co, 0) + 1
                except Exception as e:
                    log.error(f"Error updating {brf['orgnr']}: {e}")
            else:
                skipped += 1

        log.info(f"  Running totals: Updated={updated} Skipped={skipped}")
        offset += len(data)
        if len(data) < BATCH_SIZE:
            break

    return total_fetched, updated, skipped, forvaltare_counts


def extract_coadress(bv_data):
    """Extract coAdress from bolagsverket_data."""
    if not bv_data or not isinstance(bv_data, dict):
        return None
    pa = bv_data.get("postadress_detaljer")
    if not pa or not isinstance(pa, dict):
        return None
    co = pa.get("coAdress")
    if not co or not isinstance(co, str):
        return None
    co = co.strip()
    if not co:
        return None
    return co


def update_forvaltare(orgnr, forvaltare):
    """Update forvaltare column for a BRF."""
    url = f"{SUPABASE_URL}/rest/v1/foretag?orgnr=eq.{orgnr}"
    body = json.dumps({"forvaltare": forvaltare}).encode("utf-8")
    req = Request(url, data=body, headers=supabase_headers({
        "Prefer": "return=minimal",
    }), method="PATCH")
    urlopen(req, timeout=30)


def main():
    log.info("=== Förvaltare Extraction ===")

    # Step 1: Check/add column
    if not add_column_if_missing():
        log.info("")
        log.info("To add the column, run this SQL in the Supabase Dashboard SQL Editor:")
        log.info("  https://supabase.com/dashboard/project/mtozvblwsahzijmpdmfs/sql")
        log.info("")
        log.info("  ALTER TABLE foretag ADD COLUMN IF NOT EXISTS forvaltare TEXT;")
        log.info("  CREATE INDEX IF NOT EXISTS idx_foretag_forvaltare ON foretag (forvaltare);")
        log.info("")
        log.info("Then re-run this script.")
        log.info("")
        log.info("NOTE: The Next.js pages at /forvaltare already work without this column")
        log.info("by extracting data from the bolagsverket_data JSON field directly.")
        log.info("This script is an optimization to speed up queries.")
        return

    # Step 2: Fetch and process BRFs page by page
    log.info("Fetching and processing BRFs with bolagsverket_data...")
    total_fetched, updated, skipped, forvaltare_counts = fetch_and_process_brfs(update_forvaltare)

    log.info(f"Done! Total={total_fetched} Updated={updated} Skipped={skipped}")
    log.info(f"Found {len(forvaltare_counts)} unique förvaltare")

    # Show top 20
    top = sorted(forvaltare_counts.items(), key=lambda x: -x[1])[:20]
    log.info("Top 20 förvaltare:")
    for name, count in top:
        log.info(f"  {count:4d} BRF:er — {name}")


if __name__ == "__main__":
    main()
