#!/usr/bin/env python3
"""
webb_verifierare.py — verifierar BRF:ers egna hemsidor och letar publik
årsredovisningssida. Skriver till sidotabellen `brf_webb`.

  HÅRDA REGLER (kodade, inte bara dokumenterade)
  ──────────────────────────────────────────────
  * `foretag` läses ENDAST med SELECT. Ingen insert/update/upsert/delete.
  * Inga PDF:er laddas ner eller sparas. Vi läser aldrig dokumentets innehåll.
  * Inga siffror extraheras.
  * Inga personnamn extraheras eller lagras.
  * Sparas gör bara: URL:er, status, robots-flagga och tidsstämplar.

  ARTIGHET
  ────────
  * robots.txt hämtas per sajt och respekteras för vår User-Agent OCH för `*`.
  * Sajter som stänger ute AI-crawlers (ClaudeBot, GPTBot, CCBot …) med
    `Disallow: /` behandlas som opt-out även om vår UA formellt är tillåten.
    Vi är inte en av dem, men signalen är otvetydig och vi respekterar den.
  * Max 1 request/sekund per värdnamn. Max 20 sidor per sajt.
  * Ärlig User-Agent med kontaktadress och länk till /om-boten.
  * Ingen UA-förklädnad. En 403 mot vår UA är ett nej och behandlas som ett nej.

Körning:
    export SUPABASE_SERVICE_ROLE_KEY=...        # krävs för skrivning
    python3 webb_verifierare.py --pilot 200 --kalla epost-doman
    python3 webb_verifierare.py --pilot 200 --kalla epost-doman --dry-run
    python3 webb_verifierare.py --alla --kalla hemsida-falt
"""

import argparse
import json
import os
import random
import re
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.parse import urljoin, urlsplit, urlunsplit, unquote
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

# ── Konfiguration ───────────────────────────────────────────────────────────
UA = "brfinfo-bot (+https://brfinfo.se/om-boten; info@brfinfo.se)"
HEADERS = {"User-Agent": UA, "Accept-Language": "sv-SE,sv;q=0.9"}
MAX_SIDOR = 20
DELAY = 1.0          # sekunder mellan requests mot samma värd
TIMEOUT = 20
PARALLELLA_SAJTER = 8

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://mtozvblwsahzijmpdmfs.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Frimejl → e-postdomänen säger ingenting om någon hemsida.
FRIMEJL = {
    "gmail.com", "gmail.se", "hotmail.com", "hotmail.se", "hotmail.co.uk", "hotmail.fr",
    "outlook.com", "outlook.se", "live.se", "live.com", "live.nl", "telia.com",
    "icloud.com", "me.com", "yahoo.se", "yahoo.com", "yahoo.co.uk", "comhem.se",
    "bredband.net", "bredband2.com", "bredbandsbolaget.se", "spray.se", "passagen.se",
    "tele2.se", "glocalnet.net", "msn.com", "home.se", "swipnet.se", "bahnhof.se",
    "telenor.se", "tre.se", "mail.com", "protonmail.com", "gmx.com", "aol.com",
    "googlegroups.com",
}

# Förvaltar-/portaldomäner. En sida på någon av dessa är förvaltarens, inte
# föreningens — status 'portal', aldrig 'ok'.
PORTALER = [
    "hsb.se", "riksbyggen.se", "sbc.se", "bredablickforvaltning.se", "bblick.se",
    "bredablickgruppen.se", "nabo.se", "fastum.se", "simpleko.se", "storholmen.se",
    "boappa.", "brfhemsidan.se", "mbf.se", "egeryds.se", "bostadsratterna.se",
    "wallenstam.se", "arcfast.se", "vardagsappen", "boendeportal", "minasidor",
    "mypages", "brfportal", "kundportal", "medlemsportal", "mitthsb", "forvaltarportal",
    "facebook.com", "instagram.com", "linkedin.com", "wordpress.com", "blogspot.",
    "google.com", "sites.google.com", "one.com", "loopia.se", "hemsida24.se",
]

# Robotar vars totalblockering vi läser som "ingen maskinell återanvändning, tack".
AI_ROBOTAR = [
    "ClaudeBot", "anthropic-ai", "Claude-Web", "GPTBot", "OAI-SearchBot", "ChatGPT-User",
    "CCBot", "Google-Extended", "PerplexityBot", "Applebot-Extended", "Bytespider",
    "meta-externalagent", "FacebookBot", "Amazonbot", "cohere-ai", "Diffbot",
    "ImagesiftBot", "Omgilibot", "YouBot", "AI2Bot", "Timpibot", "Scrapy",
]

AR_RE = re.compile(r"(arsredovis|årsredovis|bokslut|annual[-_ ]?report)", re.I)

# Parkerad domän: föreningen äger adressen men har ingen sajt. Servern svarar
# 200 med registrarens standardsida, så utan det här mönstret ser den ut som
# "fel förening" — vilket döljer att uppgiften i registret faktiskt stämmer.
PARKERAD_RE = re.compile(
    r"(parked at loopia|domänen är parkerad|this domain has been purchased and parked|"
    r"parkerad hos|domain (?:is )?parked|denna domän är parkerad|"
    r"under construction|webbplatsen är under uppbyggnad|sidan är under konstruktion|"
    r"default web site page|it works!|welcome to nginx)", re.I
)
NAV_RE = re.compile(
    r"(ekonomi|arsredovis|årsredovis|bokslut|dokument|handling|foreningen|föreningen|"
    r"om[-_ ]?oss|stadgar|maklar|mäklar|infoblad|arkiv|info)", re.I
)

# Ord som aldrig identifierar en förening ("Gården", "Huset", "Hem" …).
GENERISKA = {
    "gard", "garden", "hus", "huset", "hem", "hemma", "gata", "gatan", "vag", "vagen",
    "torg", "torget", "park", "parken", "berg", "berget", "backe", "backen", "brf",
    "bostadsrattsforening", "bostadsrattsforeningen", "bostadsratts", "foreningen",
    "forening", "sverige", "nya", "gamla", "stora", "lilla", "norra", "sodra", "ostra",
    "vastra", "hsb", "riksbyggen", "samfallighet", "samfallighetsforening",
}

# Ortnamn är INTE identitet. Piloten 2026-09-02 gav fyra falska träffar där
# föreningens ort ensam bar beviset: "Äpplet 18 i Västerås" matchade en
# golvläggares sajt på ordet "västerås", "Sandhem 2 i Bollebygd" matchade en
# inredningsbutik på "bollebygd". Orten står på nästan varje lokal sajt.
ORTER = {
    "stockholm", "goteborg", "malmo", "uppsala", "vasteras", "orebro", "linkoping",
    "helsingborg", "jonkoping", "norrkoping", "lund", "umea", "gavle", "boras",
    "sodertalje", "eskilstuna", "halmstad", "vaxjo", "karlstad", "sundsvall",
    "ostersund", "trollhattan", "lulea", "borlange", "kalmar", "falun", "skovde",
    "kristianstad", "karlskrona", "uddevalla", "skelleftea", "varberg", "solna",
    "sollentuna", "nacka", "huddinge", "jarfalla", "taby", "haninge", "botkyrka",
    "sundbyberg", "danderyd", "lidingo", "vallentuna", "upplands", "vasby", "sigtuna",
    "norrtalje", "nykoping", "motala", "landskrona", "trelleborg", "angelholm",
    "lomma", "staffanstorp", "burlov", "vellinge", "svedala", "kavlinge", "eslov",
    "hassleholm", "ystad", "knivsta", "enkoping", "hallstahammar", "koping",
    "arboga", "katrineholm", "flen", "strangnas", "mariestad", "lidkoping",
    "alingsas", "kungalv", "molndal", "partille", "harryda", "lerum", "bollebygd",
    "vanersborg", "stenungsund", "tjorn", "orust", "sotenas", "tanum", "stromstad",
    "harnosand", "ornskoldsvik", "sollefte", "kramfors", "timra", "pitea", "boden",
    "kiruna", "gallivare", "ostersunds", "are", "krokom", "berg", "sverige",
}

# ── Global artighetsgrind: max 1 request/sekund per värdnamn ────────────────
_lock = threading.Lock()
_senast = {}


def artig_paus(host):
    while True:
        with _lock:
            t = _senast.get(host, 0.0)
            nu = time.time()
            if nu - t >= DELAY:
                _senast[host] = nu
                return
            vanta = DELAY - (nu - t)
        time.sleep(vanta)


# ── URL-normalisering ───────────────────────────────────────────────────────
def normalisera_url(rå):
    if not rå:
        return None
    u = str(rå).strip().strip("\"'<> ").rstrip(".,;")
    if not u or u.lower() in ("none", "null", "-", "n/a", "nan"):
        return None
    if u.startswith(("mailto:", "tel:")):
        return None
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u.lstrip("/")
    p = urlsplit(u)
    if not p.netloc or "." not in p.netloc:
        return None
    return urlunsplit(("https", p.netloc.lower(), p.path or "/", "", ""))


def reg_doman(host):
    h = (host or "").lower().split(":")[0]
    delar = h.split(".")
    if len(delar) <= 2:
        return h
    if delar[-2] in ("co", "com", "org", "net", "pp", "tm") and delar[-1] == "se":
        return ".".join(delar[-3:])
    return ".".join(delar[-2:])


def ar_portal(host):
    h = (host or "").lower()
    return any(p in h for p in PORTALER)


# ── Identitet: tillhör sajten föreningen? ───────────────────────────────────
def _avskala(s):
    s = (s or "").lower()
    s = s.replace("å", "a").replace("ä", "a").replace("ö", "o").replace("é", "e").replace("ü", "u")
    return re.sub(r"[^a-z0-9]+", " ", s)


def namntokens(namn):
    """Distinkta ord ur föreningsnamnet — generiska ord, rättsformer och orter bort."""
    ord_ = [w for w in _avskala(namn).split()
            if len(w) >= 4 and w not in GENERISKA and w not in ORTER]
    # Ta bort dubbletter men behåll ordningen.
    sedda, ut = set(), []
    for w in ord_:
        if w not in sedda:
            sedda.add(w)
            ut.append(w)
    return ut


def identitet_bekraftad(sidtext, namn, orgnr, markorer="", doman=""):
    """
    Bekräftar att sajten TILLHÖR föreningen — inte att den bara NÄMNER den.

    Skillnaden är hela poängen. En revisionsbyrå, en förvaltare eller en
    entreprenör listar gärna föreningen som kund; deras sajt är ändå inte
    föreningens hemsida. Piloten visade båda felen:

      falsk träff  golvläggare, revisionsbyrå, inredningsbutik och en parkerad
                   domän godkändes för att föreningens ort eller namn råkade
                   stå någonstans i texten
      falskt avslag  granneborg.se, brfstengodset16.se och brfhogmora51.se
                   avvisades för att sajterna renderas med JavaScript och
                   serverar nästan ingen text — trots att domänen är föreningens

    Tre godtagbara bevis:
      1. Organisationsnumret står på sidan. Ingen listar en kunds orgnr av misstag.
      2. Ett distinkt ord ur namnet finns BÅDE i brödtexten OCH i sajtens egen
         identitet (<title>, <h1>, og:site_name). Sajten gör anspråk på namnet.
      3. Ordet finns i DOMÄNEN och dessutom i antingen texten eller identiteten.
         Domänen ensam räcker inte: brffaran.se hade titeln "brffaran.se" och
         rubriken "OFFICE DECOR" — ett återanvänt domännamn, inte en förening.

    En titel som bara upprepar värdnamnet räknas inte som identitet — den är
    serverns standardsvar, inte ett anspråk.
    """
    hö = _avskala(sidtext)
    vard = (doman or "").lower().split(":")[0]
    # "brffaran.se" som titel är inget anspråk — filtrera bort ekot av värdnamnet.
    mark_rader = [m for m in (markorer or "").split("\n")
                  if re.sub(r"[^a-z0-9]", "", m.lower()) != re.sub(r"[^a-z0-9]", "", vard)]
    mark = _avskala(" ".join(mark_rader))
    dom_platt = re.sub(r"[^a-z0-9]", "", _avskala(vard))

    komprimerad = re.sub(r"[^0-9]", "", sidtext)
    if orgnr and orgnr in komprimerad:
        return True, "orgnr"
    tokens = namntokens(namn)
    if not tokens:
        return False, "inget distinkt namn att matcha"

    i_text = [t for t in tokens if re.search(rf"\b{re.escape(t)}", hö)]
    i_mark = [t for t in tokens if re.search(rf"\b{re.escape(t)}", mark)]
    i_doman = [t for t in tokens if t.replace(" ", "") in dom_platt]

    starkt = [t for t in i_text if t in i_mark]
    if starkt:
        return True, f"namn:{'+'.join(starkt[:3])}"
    via_doman = [t for t in i_doman if t in i_text or t in i_mark]
    if via_doman:
        return True, f"doman:{'+'.join(via_doman[:3])}"
    if i_text:
        return False, f"nämner {'+'.join(i_text[:2])} men gör inte anspråk på namnet"
    if i_doman:
        return False, f"domänen antyder {i_doman[0]} men sidan bekräftar inte"
    return False, f"namn saknas i texten (0/{len(tokens)} ord)"


# ── robots.txt ──────────────────────────────────────────────────────────────
class Robots:
    """
    Respekterar robots.txt för vår UA och för `*`. Läser dessutom AI-crawler-
    blockeringar som en opt-out-signal även när de inte gäller oss formellt.
    """

    def __init__(self, bas_url, sess):
        self.rp = None
        self.status = None
        self.ai_blockerad = False
        try:
            u = urljoin(bas_url, "/robots.txt")
            artig_paus(urlsplit(u).netloc)
            r = sess.get(u, headers=HEADERS, timeout=TIMEOUT)
            self.status = r.status_code
            if r.status_code == 200 and len(r.text) < 300_000:
                self.rp = RobotFileParser()
                self.rp.parse(r.text.splitlines())
                self.ai_blockerad = self._ai_totalblock(r.text)
        except Exception as e:
            self.status = f"err:{type(e).__name__}"

    @staticmethod
    def _ai_totalblock(txt):
        """True om någon AI-crawler har `Disallow: /` i sin grupp."""
        aktuella, träff = [], False
        for rad in txt.splitlines():
            r = rad.split("#", 1)[0].strip()
            if not r:
                aktuella = []
                continue
            m = re.match(r"(?i)user-agent:\s*(\S+)", r)
            if m:
                aktuella.append(m.group(1))
                continue
            m = re.match(r"(?i)disallow:\s*(\S*)$", r)
            if m and m.group(1) == "/":
                for ua in aktuella:
                    if any(ua.lower() == a.lower() for a in AI_ROBOTAR):
                        träff = True
        return träff

    def tillater(self, url):
        if self.rp is None:
            return True
        try:
            # can_fetch faller själv tillbaka på `*`-gruppen när vår UA saknas.
            return self.rp.can_fetch(UA, url)
        except Exception:
            return True


# ── Crawl av en sajt ────────────────────────────────────────────────────────
def granska_sajt(kand):
    """Returnerar en brf_webb-rad + diagnostik. Nätverksfel är aldrig undantag."""
    orgnr, namn = kand["orgnr"], kand["namn"]
    ut = {
        "orgnr": orgnr,
        "namn": namn,
        "start": None,
        "hemsida_url": None,
        "hemsida_status": None,
        "hemsida_verifierad_at": None,
        "arsredovisning_url": None,
        "arsredovisning_hittad_at": None,
        "robots_blockerad": False,   # hårt nej: AI-opt-out eller startsidan avvisad
        "kalla": "crawl",
        "url_ursprung": kand["url_ursprung"],
        # diagnostik, sparas inte i databasen
        "http": None,
        "slutlig_host": None,
        "sidor": 0,
        "bevis": None,
        "robots_hoppade_lankar": 0,   # diagnostik, sparas inte i databasen
        "felklass": None,
        "fel": None,
    }
    start = normalisera_url(kand["url"])
    ut["start"] = start
    if not start:
        ut["hemsida_status"] = "dod"
        ut["felklass"] = "ogiltig-url"
        return ut

    sess = requests.Session()
    sess.max_redirects = 5
    rob = Robots(start, sess)

    if rob.ai_blockerad:
        ut["robots_blockerad"] = True
        ut["hemsida_status"] = None          # ingen bedömning alls — vi tittade inte
        ut["felklass"] = "robots-ai-optout"
        return ut
    if not rob.tillater(start):
        ut["robots_blockerad"] = True
        ut["hemsida_status"] = None
        ut["felklass"] = "robots-disallow"
        return ut

    try:
        artig_paus(urlsplit(start).netloc)
        r = sess.get(start, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        ut["http"] = r.status_code
        ut["slutlig_host"] = urlsplit(r.url).netloc
        ut["sidor"] = 1
    except Exception as e:
        ut["hemsida_status"] = "dod"
        ut["felklass"] = "ingen-kontakt"
        ut["fel"] = f"{type(e).__name__}: {str(e)[:110]}"
        return ut

    if r.status_code >= 400:
        ut["hemsida_status"] = "dod"
        ut["felklass"] = f"http-{r.status_code}"
        return ut
    if "html" not in r.headers.get("Content-Type", ""):
        ut["hemsida_status"] = "dod"
        ut["felklass"] = "ej-html"
        return ut

    slut_host = ut["slutlig_host"]
    dom = reg_doman(slut_host)
    start_dom = reg_doman(urlsplit(start).netloc)

    if ar_portal(slut_host):
        ut["hemsida_status"] = "portal"
        ut["felklass"] = "portal"
        return ut

    # ── Crawla inom domänen och samla text för identitetskontrollen ──────────
    sedda = {r.url}
    kö = [(r.url, r.text, 0)]
    all_text = []
    ar_sida = None      # sidan som innehåller årsredovisningslänken
    ar_pa_start = False
    # Sajtens egen identitet: vad den kallar SIG SJÄLV. Domänen räknas med —
    # brfnorrgardet.se gör anspråk på namnet redan i adressen.
    identitetsmarkorer = []

    while kö and ut["sidor"] <= MAX_SIDOR:
        url, html, djup = kö.pop(0)
        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception:
            continue
        if djup == 0:
            if soup.title and soup.title.string:
                identitetsmarkorer.append(soup.title.string)
            for tagg in soup.find_all(["h1", "h2"], limit=4):
                identitetsmarkorer.append(tagg.get_text(" ", strip=True))
            for meta in soup.find_all("meta", property="og:site_name"):
                identitetsmarkorer.append(meta.get("content") or "")
        text = soup.get_text(" ", strip=True)[:120_000]
        all_text.append(text)

        kandidatlankar = []
        for a in soup.find_all("a", href=True):
            h = a["href"].strip()
            if h.startswith(("mailto:", "tel:", "javascript:", "#")):
                continue
            absu = urljoin(url, h)
            p = urlsplit(absu)
            if p.scheme not in ("http", "https"):
                continue
            absu = urlunsplit((p.scheme, p.netloc, p.path, p.query, ""))
            lanktext = a.get_text(" ", strip=True)[:200]
            filnamn = unquote(p.path.rsplit("/", 1)[-1])
            hö = f"{lanktext} {filnamn} {unquote(p.path)}"

            if p.path.lower().endswith(".pdf"):
                # Vi HÄMTAR aldrig PDF:en. Vi noterar bara att sidan länkar till en.
                if AR_RE.search(hö) and ar_sida is None:
                    ar_sida = url
                    if djup == 0:
                        ar_pa_start = True
                continue

            if reg_doman(p.netloc) != dom:
                continue
            if absu in sedda:
                continue
            poang = 2 if AR_RE.search(hö) else (1 if NAV_RE.search(hö) else 0)
            if djup >= 1 and poang == 0:
                continue
            kandidatlankar.append((poang, absu))

        kandidatlankar.sort(key=lambda x: -x[0])
        for _, absu in kandidatlankar:
            if ut["sidor"] >= MAX_SIDOR:
                break
            if absu in sedda:
                continue
            if not rob.tillater(absu):
                # En enskild undersida som robots.txt undantar (/wp-admin/, /login/)
                # är helt normalt och betyder inte att sajten stängt ute oss. Att
                # sätta robots_blockerad här blandade ihop två helt olika saker och
                # bröt invarianten i db/webb_schema.sql Block 4 punkt 5: en rad kan
                # då vara både publik och "blockerad". Flaggan är reserverad för
                # hårda nej — AI-opt-out eller startsidan avvisad.
                ut["robots_hoppade_lankar"] += 1
                continue
            sedda.add(absu)
            try:
                artig_paus(urlsplit(absu).netloc)
                rr = sess.get(absu, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
                ut["sidor"] += 1
                if rr.status_code < 400 and "html" in rr.headers.get("Content-Type", ""):
                    kö.append((rr.url, rr.text, djup + 1))
            except Exception:
                pass

    # ── Parkerad domän? ──────────────────────────────────────────────────────
    # Kollas FÖRE identiteten: en parkerad domän kan aldrig bekräfta identitet,
    # och "parkerad" är ett annat och nyttigare besked än "fel förening".
    startsidan = all_text[0] if all_text else ""
    if PARKERAD_RE.search(startsidan[:4000]) and ut["sidor"] <= 2:
        ut["hemsida_status"] = "dod"
        ut["felklass"] = "parkerad-doman"
        ut["bevis"] = "registrarens parkeringssida"
        return ut

    # ── Identitet ────────────────────────────────────────────────────────────
    ok, bevis = identitet_bekraftad(
        " ".join(all_text), namn, orgnr,
        markorer="\n".join(identitetsmarkorer), doman=slut_host,
    )
    ut["bevis"] = bevis
    if not ok:
        ut["hemsida_status"] = "portal" if ar_portal(slut_host) else "dod"
        ut["felklass"] = "fel-forening"
        return ut

    nu = datetime.now(timezone.utc).isoformat()
    ut["hemsida_url"] = r.url.split("#")[0]
    ut["hemsida_status"] = "ok" if dom == start_dom else "redirect"
    ut["hemsida_verifierad_at"] = nu

    if ar_sida:
        # Föredra en dokumentsida framför startsidan — besökaren ska landa där
        # dokumenten ligger. Ligger länken bara på startsidan är det ändå sant.
        ut["arsredovisning_url"] = ar_sida.split("#")[0]
        ut["arsredovisning_hittad_at"] = nu
        ut["felklass"] = "traff-med-arsredovisning" if not ar_pa_start else "traff-ar-pa-startsidan"
    else:
        ut["felklass"] = "traff-utan-arsredovisning"
    return ut


# ── Supabase (läsning: anon räcker; skrivning: service role) ────────────────
def sb_get(path, key, timeout=120, tries=8):
    h = {"apikey": key, "Authorization": f"Bearer {key}"}
    sista = None
    for i in range(tries):
        try:
            req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=h)
            return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        except Exception as e:
            sista = e
            time.sleep(2 + i)
    raise sista


def hamta_kandidater(kalla, key):
    """
    STRIKT READ-ONLY mot foretag. Enda anropet är select.

    Keyset-paginering på orgnr — `order=orgnr&offset=N` med ett
    juridisk_form-filter ger statement timeout på den här instansen.
    """
    rader, sista = [], "6999999999"
    while True:
        d = sb_get(
            "foretag?select=orgnr,namn,hemsida,email,juridisk_form"
            f"&orgnr=gt.{sista}&orgnr=lt.8000000000&order=orgnr&limit=300",
            key,
        )
        if not d:
            break
        rader += d
        sista = d[-1]["orgnr"]
        if len(d) < 300:
            break
    brf = [x for x in rader if x.get("juridisk_form") == "Bostadsrättsföreningar"]
    print(f"foretag: {len(rader)} rader i 7-serien, varav {len(brf)} BRF", flush=True)

    if kalla == "hemsida-falt":
        ut = []
        for x in brf:
            u = normalisera_url(x.get("hemsida"))
            if u:
                ut.append({"orgnr": x["orgnr"], "namn": x["namn"], "url": u,
                           "url_ursprung": "hemsida-falt"})
        return ut, brf

    # epost-doman: föreningens EGEN e-postdomän. Inte en gissning ur namnet —
    # domänen kommer från föreningens egen registrerade adress. Kravet att
    # domänen bärs av exakt EN förening sållar bort förvaltarnas domäner.
    doman_antal = {}
    for x in brf:
        e = (x.get("email") or "").strip().lower()
        if "@" not in e:
            continue
        d = e.rsplit("@", 1)[1].strip(" .,;")
        if d and "." in d:
            doman_antal[d] = doman_antal.get(d, 0) + 1
    ut = []
    for x in brf:
        e = (x.get("email") or "").strip().lower()
        if "@" not in e:
            continue
        d = e.rsplit("@", 1)[1].strip(" .,;")
        if not d or "." not in d or d in FRIMEJL:
            continue
        if doman_antal.get(d, 0) != 1:      # delad domän ⇒ förvaltare
            continue
        if ar_portal(d):
            continue
        ut.append({"orgnr": x["orgnr"], "namn": x["namn"], "url": "https://" + d,
                   "url_ursprung": "epost-doman"})
    return ut, brf


def sb_upsert(rader, key):
    body = json.dumps(rader, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/brf_webb?on_conflict=orgnr",
        data=body,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    urllib.request.urlopen(req, timeout=120)


DB_FALT = ["orgnr", "hemsida_url", "hemsida_status", "hemsida_verifierad_at",
           "arsredovisning_url", "arsredovisning_hittad_at", "robots_blockerad",
           "kalla", "url_ursprung"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pilot", type=int, help="kör N slumpade föreningar")
    ap.add_argument("--alla", action="store_true", help="kör hela kandidatlistan")
    ap.add_argument("--kalla", choices=["hemsida-falt", "epost-doman"], default="hemsida-falt",
                    help="hemsida-falt = foretag.hemsida (standard). "
                         "epost-doman = föreningens egen e-postdomän, kräver identitetsbevis.")
    ap.add_argument("--seed", type=int, default=20260902)
    ap.add_argument("--dry-run", action="store_true", help="skriv inget till databasen")
    ap.add_argument("--ut", default="webb_pilot.json", help="diagnostikfil")
    args = ap.parse_args()

    if not args.pilot and not args.alla:
        ap.error("ange --pilot N eller --alla")

    las_key = SERVICE_KEY or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not las_key:
        sys.exit("Sätt SUPABASE_SERVICE_ROLE_KEY (eller NEXT_PUBLIC_SUPABASE_ANON_KEY för --dry-run).")
    if not args.dry_run and not SERVICE_KEY:
        sys.exit("Skrivning kräver SUPABASE_SERVICE_ROLE_KEY. Kör med --dry-run annars.")

    kandidater, brf = hamta_kandidater(args.kalla, las_key)
    print(f"kandidater ({args.kalla}): {len(kandidater)}", flush=True)
    if not kandidater:
        print("Inga kandidater. Med --kalla hemsida-falt betyder det att "
              "foretag.hemsida är tom — se EGNA-HEMSIDOR.md.", flush=True)
        return

    if args.pilot:
        random.seed(args.seed)
        kandidater = random.sample(kandidater, min(args.pilot, len(kandidater)))
    print(f"kör {len(kandidater)} sajter, {PARALLELLA_SAJTER} parallellt, "
          f"1 req/s per värd, max {MAX_SIDOR} sidor/sajt", flush=True)

    resultat, lk = [], threading.Lock()

    def arbeta(k):
        try:
            o = granska_sajt(k)
        except Exception as e:
            o = {"orgnr": k["orgnr"], "namn": k["namn"], "hemsida_status": "dod",
                 "robots_blockerad": False, "kalla": "crawl",
                 "url_ursprung": k["url_ursprung"], "felklass": "krasch",
                 "fel": f"{type(e).__name__}: {str(e)[:110]}"}
        with lk:
            resultat.append(o)
            n = len(resultat)
            print(f"[{n:4}/{len(kandidater)}] {str(o.get('start'))[:40]:40} "
                  f"{str(o.get('hemsida_status')):8} {str(o.get('felklass')):26} "
                  f"sidor={o.get('sidor', 0):2} {o.get('bevis') or ''}", flush=True)

    with ThreadPoolExecutor(max_workers=PARALLELLA_SAJTER) as ex:
        list(ex.map(arbeta, kandidater))

    json.dump(resultat, open(args.ut, "w"), ensure_ascii=False, indent=1)

    # ── Sammanfattning ───────────────────────────────────────────────────────
    from collections import Counter
    n = len(resultat)
    status = Counter(str(x.get("hemsida_status")) for x in resultat)
    felklass = Counter(str(x.get("felklass")) for x in resultat)
    publika = [x for x in resultat if x.get("hemsida_status") in ("ok", "redirect")]
    med_ar = [x for x in publika if x.get("arsredovisning_url")]
    print("\n" + "=" * 64)
    print(f"N = {n}")
    print(f"  verifierad egen hemsida : {len(publika):4}  {len(publika)/n*100:5.1f} %")
    print(f"  varav med årsredovisning: {len(med_ar):4}  {len(med_ar)/n*100:5.1f} %")
    print(f"  robots-blockerade       : {sum(1 for x in resultat if x.get('robots_blockerad')):4}")
    print("\nstatus:", dict(status))
    print("felklasser:", dict(felklass.most_common()))

    if args.dry_run:
        print(f"\n--dry-run: inget skrivet. Diagnostik i {args.ut}")
        return

    # Skriv bara rader som säger något: verifierade sajter, konstaterat döda,
    # portaler och robots-opt-outs. Alla bär information vi vill slippa hämta om.
    rader = [{k: x.get(k) for k in DB_FALT} for x in resultat]
    for i in range(0, len(rader), 200):
        sb_upsert(rader[i:i + 200], SERVICE_KEY)
    print(f"\nSkrev {len(rader)} rader till brf_webb. Diagnostik i {args.ut}")


if __name__ == "__main__":
    main()
