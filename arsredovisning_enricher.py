#!/usr/bin/env python3
"""
Årsredovisning Enricher – Downloads annual reports from Bolagsverket and
extracts key financial data for BRF associations.

API: Bolagsverket Dokument API v1 (https://gw.api.bolagsverket.se/dokument/v1)
  - POST /dokumentlista  → list of available documents for an org
  - GET  /dokument/{id}  → download ZIP with iXBRL file
Rate limit: 55 API calls/minute (counts both endpoints combined).
Resumable: only processes BRFs where arsredovisning_data IS NULL.
"""

import io
import json
import re
import time
import logging
import signal
import sys
import zipfile
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from xml.etree import ElementTree as ET

# ── Config ──────────────────────────────────────────────────────────────────
BV_CLIENT_ID = "XHBDphflRmIkOuV9JU76nOOZ0V8a"
BV_CLIENT_SECRET = "C_ffY_rW0pKEfjpUTV0xCqYGfCEa"
BV_TOKEN_URL = "https://portal.api.bolagsverket.se/oauth2/token"
BV_DOK_BASE = "https://gw.api.bolagsverket.se/dokument/v1"

SUPABASE_URL = "https://mtozvblwsahzijmpdmfs.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b3p2Ymx3c2FoemlqbXBkbWZzIiwi"
    "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4NjM1OCwiZXhwIjoyMDg3"
    "ODYyMzU4fQ.7SPPGBb4NMP0I8RIqMyAcN10HOIn-Gj9QGWvJ3j24b0"
)

RATE_LIMIT = 55  # API calls per minute (dokumentlista + dokument combined)
BATCH_SIZE = 1000
LOG_FILE = "arsredovisning_enricher.log"

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


# ── Rate limiter ────────────────────────────────────────────────────────────
class RateLimiter:
    """Track API calls across both endpoints, sleep when needed."""

    def __init__(self, max_per_minute=55):
        self.max_per_minute = max_per_minute
        self.calls = []  # timestamps of calls

    def wait_if_needed(self):
        now = time.time()
        # Remove calls older than 60 seconds
        self.calls = [t for t in self.calls if now - t < 60]
        if len(self.calls) >= self.max_per_minute:
            oldest = self.calls[0]
            sleep_time = 60 - (now - oldest) + 0.5
            if sleep_time > 0:
                log.info(f"Rate limit: sleeping {sleep_time:.1f}s")
                time.sleep(sleep_time)
            self.calls = [t for t in self.calls if time.time() - t < 60]

    def record_call(self):
        self.calls.append(time.time())


rate_limiter = RateLimiter(RATE_LIMIT)


# ── HTTP helpers ────────────────────────────────────────────────────────────
def http_json(url, method="GET", data=None, headers=None, timeout=30):
    """HTTP request returning parsed JSON."""
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


def http_bytes(url, headers=None, timeout=60):
    """HTTP GET returning raw bytes."""
    if headers is None:
        headers = {}
    req = Request(url, headers=headers, method="GET")
    resp = urlopen(req, timeout=timeout)
    return resp.read()


# ── Bolagsverket OAuth ──────────────────────────────────────────────────────
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
        "scope": "dokument:read",
    }).encode("utf-8")
    req = Request(BV_TOKEN_URL, data=body, headers={
        "Content-Type": "application/x-www-form-urlencoded",
    }, method="POST")
    resp = json.loads(urlopen(req, timeout=30).read().decode("utf-8"))
    _token_cache["token"] = resp["access_token"]
    _token_cache["expires_at"] = now + resp["expires_in"]
    return _token_cache["token"]


def bv_headers():
    return {
        "Authorization": f"Bearer {get_bv_token()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


# ── Bolagsverket Document API ──────────────────────────────────────────────
def fetch_dokumentlista(orgnr):
    """POST /dokumentlista → list of documents for org (årsredovisningar only)."""
    rate_limiter.wait_if_needed()
    rate_limiter.record_call()
    # Response is an array of objects, each with identitetsbeteckning + dokumentlista
    return http_json(
        f"{BV_DOK_BASE}/dokumentlista",
        method="POST",
        data={
            "identitetsbeteckning": orgnr,
            "dokumentgrupper": ["ARSREDOVISNING-DOKGRP"],
        },
        headers=bv_headers(),
        timeout=30,
    )


def fetch_dokument(dokument_id):
    """GET /dokument/{id} → ZIP/document bytes."""
    rate_limiter.wait_if_needed()
    rate_limiter.record_call()
    return http_bytes(
        f"{BV_DOK_BASE}/dokument/{dokument_id}",
        headers={
            "Authorization": f"Bearer {get_bv_token()}",
            "Accept": "application/octet-stream, */*",
        },
        timeout=60,
    )


def get_latest_arsredovisning(api_response):
    """Pick the årsredovisning with the latest rapporteringsperiodTom.

    API response is a list: [{ identitetsbeteckning, namn, dokumentlista: [...] }]
    Each doc has: dokumentId, rapporteringsperiodTom, filformat, diarieforingstidpunkt, etc.
    """
    docs = []
    if isinstance(api_response, list):
        for entry in api_response:
            docs.extend(entry.get("dokumentlista", []))
    elif isinstance(api_response, dict):
        docs = api_response.get("dokumentlista", [])

    if not docs:
        return None

    # Sort by rapporteringsperiodTom (end of fiscal year) descending
    def sort_key(d):
        return d.get("rapporteringsperiodTom", "") or d.get("diarieforingstidpunkt", "") or ""
    docs_sorted = sorted(docs, key=sort_key, reverse=True)
    return docs_sorted[0]


# ── iXBRL parser ────────────────────────────────────────────────────────────
# Map of XBRL concept name fragments → our output field names
XBRL_FIELD_MAP = {
    # Antal lägenheter
    "AntalBostadsrattslagenheter": "antal_lagenheter",
    "AntalLagenheter": "antal_lagenheter",
    "AntalBostadsratter": "antal_lagenheter",
    "NumberOfApartments": "antal_lagenheter",
    # Årsavgift per kvm
    "ArsavgiftPerKvadratmeter": "arsavgift_per_kvm",
    "ArsavgiftKvm": "arsavgift_per_kvm",
    "AvgiftPerKvm": "arsavgift_per_kvm",
    "AnnualFeePerSquareMeter": "arsavgift_per_kvm",
    # Skulder per kvm
    "SkulderPerKvadratmeter": "skulder_per_kvm",
    "SkulderKvm": "skulder_per_kvm",
    "LanPerKvm": "skulder_per_kvm",
    "LanskulderPerKvadratmeter": "skulder_per_kvm",
    # Fond för yttre underhåll
    "FondYttreUnderhall": "fond_yttre_underhall",
    "YttreUnderhallsfond": "fond_yttre_underhall",
    "FondUnderhall": "fond_yttre_underhall",
    "UnderhallsfondBelopp": "fond_yttre_underhall",
    "YttreFond": "fond_yttre_underhall",
    # Årets resultat
    "AretsResultat": "arets_resultat",
    "AretsResultatEfterSkatt": "arets_resultat",
    "NetIncome": "arets_resultat",
    "Arsresultat": "arets_resultat",
    # Räkenskapsår
    "Rakenskapsar": "rakenskapsar",
    # Totala skulder (for calculating per kvm if needed)
    "Skulder": "total_skulder",
    "SummaKortfristigaSkulder": "summa_kortfristiga_skulder",
    "SummaLangfristigaSkulder": "summa_langfristiga_skulder",
    # Total yta (for calculating per kvm)
    "TotalYta": "total_yta",
    "TotalBostadsyta": "total_yta",
    "BostadsytaKvm": "total_yta",
}

# Namespace prefixes commonly used in iXBRL
IX_NS = {
    "ix": "http://www.xbrl.org/2013/inlineXBRL",
    "xbrli": "http://www.xbrl.org/2003/instance",
    "xhtml": "http://www.w3.org/1999/xhtml",
}


def extract_ixbrl_data(xbrl_content):
    """Parse iXBRL (inline XBRL) content and extract financial data."""
    result = {}

    # Try XML parsing first
    try:
        data = _parse_ixbrl_xml(xbrl_content)
        result.update(data)
    except ET.ParseError:
        pass

    # Also try regex-based extraction as fallback
    regex_data = _parse_ixbrl_regex(xbrl_content)
    for k, v in regex_data.items():
        if k not in result:
            result[k] = v

    return result


def _parse_ixbrl_xml(content):
    """Parse iXBRL using ElementTree."""
    result = {}

    # Register common namespaces
    for prefix, uri in IX_NS.items():
        ET.register_namespace(prefix, uri)

    # Parse the XML/XHTML
    if isinstance(content, bytes):
        text = content.decode("utf-8", errors="replace")
    else:
        text = content

    # Clean up common HTML entities that break XML parsing
    text = re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#)", "&amp;", text)

    root = ET.fromstring(text.encode("utf-8"))

    # Find all ix:nonFraction elements (numeric values)
    for elem in root.iter():
        tag = elem.tag
        # Strip namespace
        if "}" in tag:
            tag = tag.split("}", 1)[1]

        if tag in ("nonFraction", "nonNumeric"):
            name = elem.get("name", "")
            # The name is typically namespace:conceptName
            concept = name.split(":")[-1] if ":" in name else name

            for pattern, field in XBRL_FIELD_MAP.items():
                if pattern.lower() in concept.lower():
                    value = _get_element_text(elem)
                    if value is not None:
                        parsed = _parse_number(value)
                        if parsed is not None:
                            # Keep the first match (most relevant context)
                            if field not in result:
                                result[field] = parsed
                    break

    # Extract period/context info for räkenskapsår
    for elem in root.iter():
        tag = elem.tag
        if "}" in tag:
            tag = tag.split("}", 1)[1]
        if tag == "period" or tag == "instant":
            for child in elem:
                child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                if child_tag in ("endDate", "startDate"):
                    val = (child.text or "").strip()
                    if val and "rakenskapsar" not in result:
                        result.setdefault("_periods", []).append(val)

    # Derive räkenskapsår from periods
    if "_periods" in result:
        periods = sorted(result.pop("_periods"))
        if periods:
            result["rakenskapsar"] = periods[-1][:4] if len(periods[-1]) >= 4 else periods[-1]

    return result


def _parse_ixbrl_regex(content):
    """Fallback regex-based extraction for iXBRL."""
    result = {}
    if isinstance(content, bytes):
        text = content.decode("utf-8", errors="replace")
    else:
        text = content

    # Find ix:nonFraction and ix:nonNumeric elements with name attributes
    pattern = re.compile(
        r'<ix:(?:nonFraction|nonNumeric)[^>]*name="([^"]*)"[^>]*>(.*?)</ix:(?:nonFraction|nonNumeric)>',
        re.DOTALL | re.IGNORECASE,
    )

    for match in pattern.finditer(text):
        name = match.group(1)
        value = match.group(2).strip()
        concept = name.split(":")[-1] if ":" in name else name

        for map_pattern, field in XBRL_FIELD_MAP.items():
            if map_pattern.lower() in concept.lower():
                parsed = _parse_number(value)
                if parsed is not None and field not in result:
                    result[field] = parsed
                break

    # Try to find räkenskapsår from context/period elements
    period_pattern = re.compile(
        r"<xbrli:(?:endDate|startDate)>(\d{4}-\d{2}-\d{2})</xbrli:(?:endDate|startDate)>"
    )
    dates = period_pattern.findall(text)
    if dates and "rakenskapsar" not in result:
        dates.sort()
        result["rakenskapsar"] = dates[-1][:4]

    return result


def _get_element_text(elem):
    """Get all text content of an element, including children."""
    parts = []
    if elem.text:
        parts.append(elem.text)
    for child in elem:
        if child.text:
            parts.append(child.text)
        if child.tail:
            parts.append(child.tail)
    if elem.tail:
        parts.append(elem.tail)
    text = "".join(parts).strip()
    return text if text else None


def _parse_number(text):
    """Parse a number from text, handling Swedish formatting."""
    if not text:
        return None
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text).strip()
    # Remove spaces and non-breaking spaces
    text = text.replace("\xa0", "").replace(" ", "").replace("\u2009", "")
    # Handle negative numbers with minus sign variants
    text = text.replace("−", "-").replace("–", "-")
    # Swedish: comma as decimal separator
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    elif "," in text and "." in text:
        # e.g., 1.234,56 → 1234.56
        text = text.replace(".", "").replace(",", ".")
    try:
        num = float(text)
        return int(num) if num == int(num) else num
    except (ValueError, OverflowError):
        return None


def extract_from_zip(zip_bytes):
    """Extract iXBRL file from ZIP and parse it."""
    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile:
        log.warning("Not a valid ZIP file")
        # Maybe it's raw iXBRL?
        return extract_ixbrl_data(zip_bytes)

    # Find the iXBRL file (usually .xhtml or .html)
    ixbrl_file = None
    for name in zf.namelist():
        lower = name.lower()
        if lower.endswith((".xhtml", ".html", ".htm", ".xml")):
            ixbrl_file = name
            break

    if not ixbrl_file:
        # Try first file
        if zf.namelist():
            ixbrl_file = zf.namelist()[0]
        else:
            return {}

    log.debug(f"Parsing iXBRL file: {ixbrl_file}")
    content = zf.read(ixbrl_file)
    return extract_ixbrl_data(content)


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
    """Fetch all BRFs where arsredovisning_data IS NULL."""
    all_brfs = []
    offset = 0
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/foretag"
            f"?select=orgnr,namn"
            f"&juridisk_form=eq.Bostadsr%C3%A4ttsf%C3%B6reningar"
            f"&arsredovisning_data=is.null"
            f"&order=orgnr"
            f"&limit={BATCH_SIZE}&offset={offset}"
        )
        data = http_json(url, headers=supabase_headers())
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


# ── Process one BRF ────────────────────────────────────────────────────────
def process_brf(orgnr, namn):
    """Fetch documents, download latest, parse iXBRL, return enrichment data."""
    # Step 1: Get document list (filtered to ARSREDOVISNING-DOKGRP)
    dok_response = fetch_dokumentlista(orgnr)
    doc = get_latest_arsredovisning(dok_response)

    if not doc:
        return {"error": "no_documents"}

    dok_id = doc.get("dokumentId")
    if not dok_id:
        return {"error": "no_document_id", "document": str(doc)[:500]}

    # Step 2: Download document
    zip_bytes = fetch_dokument(dok_id)

    if not zip_bytes or len(zip_bytes) < 100:
        return {"error": "empty_document", "size": len(zip_bytes) if zip_bytes else 0}

    # Step 3: Parse iXBRL
    parsed = extract_from_zip(zip_bytes)

    if not parsed:
        return {
            "error": "parse_failed",
            "dokument_id": dok_id,
            "zip_size": len(zip_bytes),
        }

    # Add metadata from the document record
    parsed["dokument_id"] = dok_id
    parsed["hamtat"] = datetime.now(timezone.utc).isoformat()
    if doc.get("rapporteringsperiodTom"):
        parsed.setdefault("rakenskapsar", doc["rapporteringsperiodTom"][:4])
    if doc.get("filformat"):
        parsed["filformat"] = doc["filformat"]

    return parsed


# ── Main loop ───────────────────────────────────────────────────────────────
def main():
    test_mode = "--test" in sys.argv
    test_limit = 3

    log.info("Starting årsredovisning enrichment...")
    if test_mode:
        log.info(f"TEST MODE: processing only {test_limit} BRFs")

    # Fetch BRFs to process
    brfs = fetch_brfs_to_process()
    total = len(brfs)
    log.info(f"Found {total} BRFs to process")

    if total == 0:
        log.info("Nothing to do.")
        return

    if test_mode:
        brfs = brfs[:test_limit]
        total = len(brfs)

    success = 0
    errors = 0
    skipped = 0
    start_time = time.time()

    for i, brf in enumerate(brfs):
        if shutdown_requested:
            log.info(f"Shutting down gracefully. Processed {i}/{total}")
            break

        orgnr = brf["orgnr"]
        namn = brf.get("namn", "?")

        try:
            enrichment = process_brf(orgnr, namn)
            now = datetime.now(timezone.utc).isoformat()

            if enrichment.get("error"):
                log.warning(f"[{i+1}/{total}] {orgnr} ({namn}): {enrichment['error']}")
                update_brf(orgnr, {
                    "arsredovisning_data": json.dumps(enrichment, ensure_ascii=False),
                })
                skipped += 1
            else:
                log.info(
                    f"[{i+1}/{total}] {orgnr} ({namn}): OK "
                    f"lgh={enrichment.get('antal_lagenheter', '?')} "
                    f"avgift/kvm={enrichment.get('arsavgift_per_kvm', '?')} "
                    f"skuld/kvm={enrichment.get('skulder_per_kvm', '?')} "
                    f"fond={enrichment.get('fond_yttre_underhall', '?')} "
                    f"resultat={enrichment.get('arets_resultat', '?')}"
                )
                update_brf(orgnr, {
                    "arsredovisning_data": json.dumps(enrichment, ensure_ascii=False),
                })
                success += 1

        except HTTPError as e:
            errors += 1
            error_body = ""
            try:
                error_body = e.read().decode("utf-8")[:500]
            except Exception:
                pass
            log.error(f"[{i+1}/{total}] HTTP {e.code} for {orgnr}: {error_body}")

            if e.code == 429:
                log.warning("Rate limited! Sleeping 120s...")
                time.sleep(120)

        except Exception as e:
            errors += 1
            log.error(f"[{i+1}/{total}] Error for {orgnr} ({namn}): {e}")

        # Progress logging every 50
        if (i + 1) % 50 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / (elapsed / 60) if elapsed > 0 else 0
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
