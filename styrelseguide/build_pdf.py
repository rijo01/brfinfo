#!/usr/bin/env python3
"""
Bygger premium-PDF för "Den välskötta bostadsrättsföreningen".

INNEHÅLLSREGEL: All brödtext hämtas ORDAGRANT ur manus.md via parsern nedan.
Inget innehåll skrivs i denna fil — endast struktur, klassificering och design.
"""
import re
import html
import pathlib

BASE = pathlib.Path(__file__).resolve().parent
SRC = BASE / "manus2.md"
OUT_HTML = BASE / "output" / "brf-styrelseguide.html"
OUT_PDF = BASE / "output" / "brf-styrelseguide.pdf"
FONTS = BASE / "fonts"

# ---------------------------------------------------------------------------
# 1. Läs källan
# ---------------------------------------------------------------------------
raw = SRC.read_text(encoding="utf-8")

# --- front matter ---
fm = {}
m = re.match(r"^---\n(.*?)\n---\n", raw, re.S)
body_md = raw
if m:
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip('"')
    body_md = raw[m.end():]

# ---------------------------------------------------------------------------
# 2. Tokenisera markdown (rad för rad)
# ---------------------------------------------------------------------------
def inline(text):
    """Escape + **bold** -> <strong>. Texten kommer ordagrant från manus."""
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # kursiv: *text* (körs efter bold så inga ** stör) — texten ändras inte
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    return text

tokens = []  # (type, payload)
lines = body_md.splitlines()
i = 0
while i < len(lines):
    line = lines[i].rstrip("\n")
    s = line.strip()
    if not s:
        i += 1
        continue
    if s == "---":
        tokens.append(("hr", None))
        i += 1
        continue
    if s.startswith("### "):
        tokens.append(("h3", s[4:].strip()))
        i += 1
        continue
    if s.startswith("## "):
        tokens.append(("h2", s[3:].strip()))
        i += 1
        continue
    if s.startswith("# "):
        tokens.append(("h1", s[2:].strip()))
        i += 1
        continue
    if s.startswith("- "):
        items = []
        while i < len(lines) and lines[i].strip().startswith("- "):
            items.append(lines[i].strip()[2:].strip())
            i += 1
        tokens.append(("ul", items))
        continue
    if s.startswith(">"):
        # blockquote / citatruta — slå ihop följande >-rader, behåll texten ordagrant
        qlines = []
        while i < len(lines) and lines[i].strip().startswith(">"):
            qlines.append(lines[i].strip()[1:].strip())
            i += 1
        tokens.append(("blockquote", " ".join(qlines).strip()))
        continue
    # paragraph — slå ihop mjukbrutna rader (utan tom rad emellan) till ett stycke
    para = [s]
    i += 1
    while i < len(lines):
        nxt = lines[i].strip()
        if (not nxt) or nxt == "---" or nxt.startswith("#") or nxt.startswith("- ") or nxt.startswith(">"):
            break
        para.append(nxt)
        i += 1
    tokens.append(("p", " ".join(para)))

# ---------------------------------------------------------------------------
# 3. Bygg dokumentmodell
# ---------------------------------------------------------------------------
# Emfasparagrafer (författarens uttryckliga nyckelinsikter) — markeras via prefix,
# texten ändras INTE; endast styling i form av teal-citatlinje appliceras i läge.
INSIGHT_PREFIXES = (
    "Det här är den enskilt viktigaste punkten",
    "Den viktigaste insikten för en styrelse",
    "Det här är en av de viktigaste sakerna",
)

def is_insight(t):
    return any(t.startswith(p) for p in INSIGHT_PREFIXES)

doc = []          # ordnad lista av sidobjekt
disclaimer_blocks = []
early_disclaimer = None   # juridisk ansvarsfriskrivning: egen sida direkt efter omslaget, FÖRE TOC

def new_chapter(num, title, kind="chapter"):
    return {"type": "chapter", "kind": kind, "num": num, "title": title, "blocks": []}

current = None        # aktuellt kapitel-dict
mode = None           # "status" | "disclaimer" | "chapter" | None
part_counter = 0
chapter_seen = []     # för TOC

def push_block(b):
    if current is not None:
        current["blocks"].append(b)

idx = 0
for typ, payload in tokens:
    if typ == "hr":
        continue
    if typ == "h1":
        title = payload
        if title.startswith("Introduktion"):
            mode = "chapter"
            current = {"type": "intro", "title": title, "blocks": []}
            doc.append(current)
            continue
        if title.startswith("DEL"):
            # "DEL 1 — GRUNDEN"
            mdel = re.match(r"DEL\s+(\d+)\s*[—-]\s*(.+)", title)
            num = mdel.group(1) if mdel else ""
            ptitle = mdel.group(2).strip() if mdel else title
            part_counter += 1
            doc.append({"type": "part", "label": "DEL", "num": num, "title": ptitle})
            mode = None
            current = None
            continue
        if title.startswith("BILAGOR"):
            doc.append({"type": "part", "label": "", "num": "", "title": "Bilagor"})
            mode = "appendix"
            current = None
            continue
        if title.startswith("Juridisk ansvarsfriskrivning"):
            # Egen sida direkt efter omslaget, FÖRE innehållsförteckningen.
            # Samlas separat (ej i doc) och renderas mellan omslag och TOC.
            mode = "disclaimer"
            current = {"type": "disclaimer", "title": title, "blocks": []}
            early_disclaimer = current
            continue
        if title.startswith("Ansvarsfriskrivning"):
            mode = "disclaimer"
            current = {"type": "disclaimer", "title": title, "blocks": []}
            doc.append(current)
            continue
        # fallback
        continue
    if typ == "h2":
        title = payload
        mk = re.match(r"Kapitel\s+(\d+)\s*[:：]\s*(.+)", title)
        if mk:
            current = new_chapter(mk.group(1), mk.group(2).strip(), kind="chapter")
            doc.append(current)
            mode = "chapter"
        else:
            # appendix subsection (under BILAGOR) eller övrigt
            current = new_chapter("", title, kind="appendix")
            doc.append(current)
            mode = "chapter"
        continue
    if typ == "h3":
        if current is None:
            continue
        push_block(("h3", payload))
        continue
    if typ == "p":
        text = payload
        if mode == "disclaimer":
            current["blocks"].append(("p", text))
            continue
        if current is None:
            continue
        if text.startswith("[EJ SKRIVET ÄNNU"):
            push_block(("placeholder", text))
        elif is_insight(text):
            push_block(("insight", text))
        else:
            push_block(("p", text))
        continue
    if typ == "ul":
        if current is None:
            continue
        push_block(("ul", payload))
        continue
    if typ == "blockquote":
        if current is None:
            continue
        push_block(("blockquote", payload))
        continue

# ---------------------------------------------------------------------------
# 4. Render HTML
# ---------------------------------------------------------------------------
def render_blocks(blocks, section_ctx=None, dropcap=False):
    """Renderar kapitelblock med medvetenhet om sektionskontext (CHECKLISTA, Rollerna)."""
    out = []
    in_checklist = False
    in_rolebox = False
    cur_section = None
    dropcap_pending = dropcap   # klyv ut första bokstaven i första stycket (anfang)

    def close_role():
        nonlocal in_rolebox
        if in_rolebox:
            out.append("</div>")
            in_rolebox = False

    for typ, payload in blocks:
        if typ == "h3":
            close_role()
            cur_section = payload
            if payload.upper().startswith("CHECKLISTA"):
                # rubrik renderas inuti checklist-box vid ul
                pending_checklist_title = payload
                out.append(f'<h3 class="checklist-head">{inline(payload)}</h3>')
            else:
                out.append(f'<h3 class="section-head">{inline(payload)}</h3>')
            continue
        if typ == "p":
            # Rollerna i korthet -> faktaruta med bold-ledda rader
            if cur_section and cur_section.startswith("Rollerna i korthet") and payload.startswith("**"):
                if not in_rolebox:
                    out.append('<div class="rolebox">')
                    in_rolebox = True
                mrole = re.match(r"\*\*(.+?)\*\*\s*(.*)", payload)
                if mrole:
                    label = html.escape(mrole.group(1))
                    rest = inline(mrole.group(2))
                    out.append(f'<div class="role"><span class="role-name">{label}</span>'
                               f'<span class="role-text">{rest}</span></div>')
                    continue
            close_role()
            if dropcap_pending and payload:
                # Anfang: floata första bokstaven i ett eget span. ::first-letter används
                # INTE här (WeasyPrint felpositionerar då floaten). Resten av stycket börjar
                # på andra bokstaven så ingen bokstav dubbleras.
                first, rest = payload[0], payload[1:]
                out.append(f'<p><span class="dropcap">{html.escape(first)}</span>{inline(rest)}</p>')
                dropcap_pending = False
            else:
                out.append(f"<p>{inline(payload)}</p>")
            continue
        if typ == "insight":
            close_role()
            out.append(f'<blockquote class="insight">{inline(payload)}</blockquote>')
            continue
        if typ == "blockquote":
            close_role()
            out.append(f'<blockquote class="callout">{inline(payload)}</blockquote>')
            continue
        if typ == "placeholder":
            close_role()
            out.append(
                '<div class="placeholder">'
                '<div class="placeholder-badge">Kommande kapitel</div>'
                f'<div class="placeholder-text">{inline(payload)}</div>'
                '</div>'
            )
            continue
        if typ == "ul":
            close_role()
            is_check = bool(cur_section and cur_section.upper().startswith("CHECKLISTA"))
            cls = "checklist" if is_check else "bullets"
            wrap_open = '<div class="checklist-box">' if is_check else ""
            wrap_close = "</div>" if is_check else ""
            if is_check:
                # Printbar tom kryssruta (U+2610) framför varje checklist-rad.
                lis = "".join(f'<li><span class="cbox">☐</span>{inline(it)}</li>' for it in payload)
            else:
                lis = "".join(f"<li>{inline(it)}</li>" for it in payload)
            out.append(f'{wrap_open}<ul class="{cls}">{lis}</ul>{wrap_close}')
            continue
    close_role()
    return "\n".join(out)


def slug(n):
    return re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-")

pages = []
toc_entries = []   # (level, label, title, anchor)

# --- Omslag ---
pages.append(f'''
<section class="cover">
  <div class="cover-frame"></div>
  <div class="cover-inner">
    <div class="cover-top">
      <div class="cover-brand">{html.escape(fm.get("utgivare","brfinfo.se"))}</div>
      <div class="cover-rule"></div>
    </div>
    <div class="cover-mid">
      <div class="cover-kicker">Praktisk handbok för styrelsen</div>
      <h1 class="cover-title">{html.escape(fm.get("titel",""))}</h1>
      <div class="cover-diamond">◆</div>
      <p class="cover-sub">{html.escape(fm.get("undertitel",""))}</p>
      <p class="cover-subline">För styrelser som vill få kontroll på ekonomi, avtal, underhåll och juridiska risker – utan att drunkna i administration.</p>
    </div>
    <div class="cover-bottom">
      <div class="cover-rule"></div>
      <div class="cover-foot">{html.escape(fm.get("utgivare","brfinfo.se"))} · Styrelsehandbok</div>
    </div>
  </div>
</section>
''')

# --- Juridisk ansvarsfriskrivning (egen sida direkt efter omslaget, FÖRE TOC) ---
if early_disclaimer is not None:
    ed_inner = render_blocks(early_disclaimer["blocks"])
    pages.append(f'''
<section class="chapter disclaimer-page" id="juridisk-ansvarsfriskrivning">
  <header class="chapter-head" data-title="{html.escape(early_disclaimer["title"])}">
    <div class="chapter-kicker">Viktigt</div>
    <h1 class="chapter-title">{html.escape(early_disclaimer["title"])}</h1>
    <div class="chapter-rule"></div>
  </header>
  <div class="chapter-body disclaimer-body">{ed_inner}</div>
</section>
''')

# --- TOC (placeholder, fylls efter att vi byggt entries) ---
TOC_MARKER = "<!--TOC-->"
pages.append(TOC_MARKER)

# --- Brödinnehåll ---
body_html = []
for node in doc:
    if node["type"] == "part":
        anchor = "part-" + slug(node["title"])
        toc_entries.append(("part", node["label"], node["title"], node["num"], anchor))
        num_html = f'<div class="part-num">{html.escape(node["num"])}</div>' if node["num"] else ""
        label_html = f'<div class="part-label">{html.escape(node["label"])}</div>' if node["label"] else '<div class="part-label">&nbsp;</div>'
        body_html.append(f'''
<section class="part" id="{anchor}">
  <div class="part-inner">
    {label_html}
    {num_html}
    <div class="part-line"></div>
    <h1 class="part-title">{html.escape(node["title"])}</h1>
  </div>
</section>
''')
        continue

    if node["type"] == "intro":
        anchor = "intro"
        toc_entries.append(("chapter", "", node["title"], "", anchor))
        inner = render_blocks(node["blocks"], dropcap=True)
        body_html.append(f'''
<section class="chapter intro-chapter" id="{anchor}">
  <header class="chapter-head" data-title="{html.escape(node["title"])}">
    <div class="chapter-kicker">Förord</div>
    <h1 class="chapter-title">{html.escape(node["title"])}</h1>
    <div class="chapter-rule"></div>
  </header>
  <div class="chapter-body lead">{inner}</div>
</section>
''')
        continue

    if node["type"] == "disclaimer":
        anchor = "ansvarsfriskrivning"
        toc_entries.append(("chapter", "", node["title"], "", anchor))
        inner = render_blocks(node["blocks"])
        body_html.append(f'''
<section class="chapter disclaimer-page" id="{anchor}">
  <header class="chapter-head" data-title="{html.escape(node["title"])}">
    <div class="chapter-kicker">Viktigt</div>
    <h1 class="chapter-title">{html.escape(node["title"])}</h1>
    <div class="chapter-rule"></div>
  </header>
  <div class="chapter-body disclaimer-body">{inner}</div>
</section>
''')
        continue

    if node["type"] == "chapter":
        is_app = node["kind"] == "appendix"
        anchor = ("kap-" + (node["num"] or slug(node["title"]))) if not is_app else ("bil-" + slug(node["title"]))
        toc_entries.append(("chapter", node["num"], node["title"], node["num"], anchor))
        inner = render_blocks(node["blocks"])
        if is_app:
            numblock = '<div class="chapter-kicker">Bilaga</div>'
            bignum = ""
        else:
            numblock = '<div class="chapter-kicker">Kapitel</div>'
            bignum = f'<div class="chapter-bignum">{int(node["num"]):02d}</div>'
        body_html.append(f'''
<section class="chapter" id="{anchor}">
  <header class="chapter-head" data-title="{html.escape(node["title"])}">
    {bignum}
    {numblock}
    <h1 class="chapter-title">{html.escape(node["title"])}</h1>
    <div class="chapter-rule"></div>
  </header>
  <div class="chapter-body">{inner}</div>
</section>
''')
        continue

# --- Bygg TOC ---
toc_rows = []
for level, label, title, num, anchor in toc_entries:
    if level == "part":
        lbl = (f'{label} {num}'.strip()) if (label or num) else ""
        toc_rows.append(
            f'<li class="toc-part"><a href="#{anchor}">'
            f'<span class="toc-lbl">{html.escape(lbl)}</span>'
            f'<span class="toc-txt">{html.escape(title)}</span></a></li>'
        )
    else:
        numtxt = (f'{int(num):02d}' if num.isdigit() else "")
        numspan = f'<span class="toc-num">{numtxt}</span>' if numtxt else '<span class="toc-num toc-num-empty"></span>'
        toc_rows.append(
            f'<li class="toc-chap"><a href="#{anchor}">'
            f'{numspan}<span class="toc-txt">{html.escape(title)}</span></a></li>'
        )

toc_html = f'''
<section class="toc-page">
  <h1 class="toc-title">Innehåll</h1>
  <div class="toc-rule"></div>
  <ul class="toc">
    {''.join(toc_rows)}
  </ul>
</section>
'''

pages = [p if p != TOC_MARKER else toc_html for p in pages]
pages.extend(body_html)

# ---------------------------------------------------------------------------
# 5. CSS
# ---------------------------------------------------------------------------
FU = (FONTS).as_uri()
CSS = f'''
@font-face {{ font-family:'Fraunces'; src:url('{FU}/Fraunces-Regular.ttf'); font-weight:400; }}
@font-face {{ font-family:'Fraunces'; src:url('{FU}/Fraunces-SemiBold.ttf'); font-weight:600; }}
@font-face {{ font-family:'Fraunces'; src:url('{FU}/Fraunces-Black.ttf'); font-weight:900; }}
@font-face {{ font-family:'Fraunces'; src:url('{FU}/Fraunces-Italic.ttf'); font-weight:400; font-style:italic; }}
@font-face {{ font-family:'Inter'; src:url('{FU}/Inter-Regular.ttf'); font-weight:400; }}
@font-face {{ font-family:'Inter'; src:url('{FU}/Inter-Medium.ttf'); font-weight:500; }}
@font-face {{ font-family:'Inter'; src:url('{FU}/Inter-SemiBold.ttf'); font-weight:600; }}
@font-face {{ font-family:'Inter'; src:url('{FU}/Inter-Bold.ttf'); font-weight:700; }}
@font-face {{ font-family:'Inter'; src:url('{FU}/Inter-Italic.ttf'); font-weight:400; font-style:italic; }}

:root {{
  --navy:#0F1F2D; --teal:#1B7C6E; --gold:#C9932A; --cream:#F5F1E8;
  --ink:#1d2730; --muted:#5d6b73; --line:#dcd6c8;
}}

@page {{
  size: A4;
  margin: 24mm 22mm 22mm 22mm;
  @top-left {{
    content: "Den välskötta bostadsrättsföreningen";
    font-family:'Inter'; font-size:7.5pt; letter-spacing:.06em;
    color:#9aa4ab; text-transform:uppercase; padding-bottom:3mm;
    vertical-align:bottom;
  }}
  @top-right {{
    content: string(chaptertitle);
    font-family:'Inter'; font-size:7.5pt; letter-spacing:.06em;
    color:#9aa4ab; text-transform:uppercase; padding-bottom:3mm;
    vertical-align:bottom;
  }}
  @bottom-left {{
    content:"brfinfo.se";
    font-family:'Inter'; font-size:8pt; color:var(--gold);
    letter-spacing:.08em; border-top:.5pt solid var(--gold);
    padding-top:2.4mm; vertical-align:top; width:100%;
  }}
  @bottom-center {{
    content:"";
    border-top:.5pt solid var(--gold); padding-top:2.4mm;
    vertical-align:top; width:100%;
  }}
  @bottom-right {{
    content: counter(page);
    font-family:'Inter'; font-size:8pt; color:var(--muted);
    border-top:.5pt solid var(--gold); padding-top:2.4mm;
    vertical-align:top; width:100%; text-align:right;
  }}
}}

/* Sidor utan sidhuvud/sidfot */
@page cover {{ margin:0; @top-left{{content:none}} @top-right{{content:none}}
  @bottom-left{{content:none}} @bottom-center{{content:none}} @bottom-right{{content:none}} }}
@page plain {{ @top-left{{content:none}} @top-right{{content:none}}
  @bottom-left{{content:none}} @bottom-center{{content:none}} @bottom-right{{content:none}} }}
@page divider {{ margin:0; @top-left{{content:none}} @top-right{{content:none}}
  @bottom-left{{content:none}} @bottom-center{{content:none}} @bottom-right{{content:none}} }}

* {{ box-sizing:border-box; }}
html {{ font-family:'Inter'; color:var(--ink); font-size:11pt; line-height:1.58; }}
body {{ margin:0; }}

p {{ margin:0 0 9pt 0; text-align:justify; hyphens:auto;
     /* dämpad avstavning: bara långa sammansatta ord (>=12 tecken) får brytas,
        med minst 5 tecken före och 4 efter brottet — inga korta ord delas */
     hyphenate-limit-chars:12 5 4; }}
strong {{ font-weight:600; color:var(--navy); }}

/* ---------- OMSLAG ---------- */
.cover {{
  page:cover; position:relative; width:210mm; height:297mm;
  background:var(--navy); color:var(--cream);
  page-break-after:always; overflow:hidden;
}}
.cover-frame {{
  position:absolute; top:12mm; left:12mm; right:12mm; bottom:12mm;
  border:.75pt solid rgba(201,147,42,.55);
}}
.cover-inner {{
  position:absolute; top:26mm; left:26mm; right:26mm; bottom:26mm;
  display:flex; flex-direction:column; justify-content:space-between;
}}
.cover-top {{ text-align:center; }}
.cover-brand {{
  font-family:'Inter'; font-weight:600; letter-spacing:.42em;
  text-transform:uppercase; font-size:11pt; color:var(--gold);
  margin-bottom:6mm;
}}
.cover-rule {{ height:.75pt; background:var(--gold); width:46mm; margin:0 auto; opacity:.8; }}
.cover-mid {{ text-align:center; }}
.cover-kicker {{
  font-family:'Inter'; letter-spacing:.36em; text-transform:uppercase;
  font-size:9.5pt; color:rgba(245,241,232,.7); margin-bottom:10mm;
}}
.cover-title {{
  font-family:'Fraunces'; font-weight:900; color:var(--gold);
  font-size:46pt; line-height:1.04; margin:0; letter-spacing:-.01em;
}}
.cover-diamond {{ color:var(--gold); font-size:13pt; margin:9mm 0 8mm; opacity:.85; }}
.cover-sub {{
  font-family:'Fraunces'; font-style:italic; font-weight:400;
  color:var(--cream); font-size:15pt; line-height:1.5; margin:0 auto;
  max-width:115mm; text-align:center;
}}
.cover-subline {{
  font-family:'Inter'; font-weight:400; font-style:normal;
  color:var(--gold); font-size:10.5pt; line-height:1.55;
  margin:8mm auto 0; max-width:120mm; text-align:center; letter-spacing:.01em;
}}
.cover-bottom {{ text-align:center; }}
.cover-foot {{
  font-family:'Inter'; letter-spacing:.22em; text-transform:uppercase;
  font-size:8.5pt; color:rgba(245,241,232,.65); margin-top:6mm;
}}

/* ---------- TOC ---------- */
.toc-page {{ page:plain; page-break-after:always; padding-top:10mm; }}
.toc-title {{
  font-family:'Fraunces'; font-weight:900; color:var(--navy);
  font-size:34pt; margin:0 0 4mm;
}}
.toc-rule {{ height:1pt; background:var(--gold); width:38mm; margin-bottom:11mm; }}
ul.toc {{ list-style:none; margin:0; padding:0; }}
ul.toc li {{ margin:0; }}
.toc-part {{ margin-top:9mm; margin-bottom:2mm; }}
.toc-part:first-child {{ margin-top:0; }}
.toc-part a {{
  display:flex; align-items:baseline; text-decoration:none; color:var(--navy);
  font-family:'Inter'; font-weight:700; text-transform:uppercase;
  letter-spacing:.12em; font-size:10pt;
}}
.toc-part .toc-lbl {{ color:var(--gold); margin-right:5mm; white-space:nowrap; font-size:9pt; }}
.toc-part .toc-txt {{ color:var(--navy); }}
.toc-part a::after {{
  content: target-counter(attr(href), page);
  margin-left:auto; padding-left:3mm; color:var(--gold);
  font-weight:600; font-size:9.5pt;
}}
.toc-chap a {{
  display:flex; align-items:baseline; text-decoration:none;
  font-family:'Inter'; font-size:10.5pt; color:var(--ink);
  padding:1.7mm 0; border-bottom:.4pt dotted #cfc9bb;
}}
.toc-chap .toc-num {{
  font-family:'Fraunces'; font-weight:600; color:var(--teal);
  width:11mm; font-size:10.5pt; flex:none;
}}
.toc-chap .toc-txt {{ flex:0 1 auto; }}
.toc-chap a::before {{
  content: leader('.'); order:2; flex:1 1 auto;
  color:#cfc9bb; margin:0 2mm;
}}
.toc-chap a::after {{
  content: target-counter(attr(href), page);
  order:3; color:var(--muted); font-variant-numeric:tabular-nums;
  font-size:10pt;
}}
.toc-chap .toc-txt {{ order:1; }}
.toc-chap .toc-num {{ order:0; }}

/* ---------- DELOMSLAG ---------- */
.part {{
  page:divider; position:relative; width:210mm; height:297mm;
  background:var(--navy); color:var(--cream);
  page-break-before:always; page-break-after:always; overflow:hidden;
}}
.part-inner {{
  position:absolute; top:0; left:30mm; right:30mm; bottom:0;
  display:flex; flex-direction:column; justify-content:center;
}}
.part-label {{
  font-family:'Inter'; font-weight:600; letter-spacing:.4em;
  text-transform:uppercase; font-size:11pt; color:var(--gold);
  margin-bottom:4mm;
}}
.part-num {{
  font-family:'Fraunces'; font-weight:900; color:rgba(201,147,42,.92);
  font-size:120pt; line-height:.9; margin:0 0 6mm -2mm;
}}
.part-line {{ width:54mm; height:1pt; background:var(--gold); margin-bottom:9mm; }}
.part-title {{
  font-family:'Fraunces'; font-weight:400; color:var(--cream);
  font-size:38pt; line-height:1.1; margin:0; letter-spacing:.01em;
}}

/* ---------- KAPITEL ---------- */
.chapter {{ page-break-before:always; string-set: chaptertitle attr(data-title); }}
.chapter-head {{ margin-bottom:9mm; string-set: chaptertitle attr(data-title); }}
.chapter-bignum {{
  font-family:'Fraunces'; font-weight:900; color:var(--cream);
  font-size:74pt; line-height:.85; letter-spacing:-.02em;
  -webkit-text-stroke:0; color:#EDE6D5; margin-bottom:1mm;
}}
.chapter-kicker {{
  font-family:'Inter'; font-weight:600; letter-spacing:.28em;
  text-transform:uppercase; font-size:9pt; color:var(--gold);
  margin-bottom:3mm;
}}
.chapter-title {{
  font-family:'Fraunces'; font-weight:600; color:var(--navy);
  font-size:27pt; line-height:1.12; margin:0; letter-spacing:-.005em;
}}
.chapter-rule {{ height:1pt; background:var(--gold); width:30mm; margin-top:7mm; }}
.chapter-body {{ }}

.section-head {{
  font-family:'Fraunces'; font-weight:600; color:var(--navy);
  font-size:14.5pt; line-height:1.25; margin:9mm 0 3mm;
  -weasy-bookmark-level:none;
}}
.chapter-body h3 {{ break-after:avoid; }}

/* Lead / förord */
.lead .dropcap {{
  font-family:'Fraunces'; font-weight:900; color:var(--teal);
  font-size:46pt; line-height:1; float:left; padding:0 3mm 0 0;
}}
.lead p {{ font-size:11.5pt; }}

/* Nyckelinsikt (teal citatlinje, ordagrann text i läge) */
blockquote.insight {{
  margin:7mm 0; padding:1mm 0 1mm 8mm;
  border-left:3pt solid var(--teal);
  font-family:'Fraunces'; font-style:italic; font-weight:400;
  font-size:13.5pt; line-height:1.5; color:var(--navy);
  text-align:left;
}}

/* Citatruta för markdown-blockquote (> ) — guldaccent, kräm bakgrund */
blockquote.callout {{
  margin:6mm 0; padding:6mm 8mm; border-left:3pt solid var(--gold);
  background:var(--cream); border-radius:4pt;
  font-family:'Inter'; font-size:11pt; line-height:1.55;
  color:var(--navy); text-align:left; break-inside:avoid;
}}
blockquote.callout strong {{ color:var(--teal); }}

/* Checklista */
h3.checklist-head {{
  font-family:'Inter'; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; font-size:10pt; color:var(--teal);
  margin:9mm 0 3mm;
}}
.checklist-box {{
  background:var(--cream); border-radius:5pt; padding:8mm 9mm 6mm;
  margin:0 0 6mm; break-inside:avoid;
}}
ul.checklist {{ list-style:none; margin:0; padding:0; }}
ul.checklist li {{
  position:relative; padding:0 0 4mm 9mm; font-size:10.5pt;
  color:#37424a; line-height:1.5;
}}
ul.checklist li:last-child {{ padding-bottom:0; }}
/* Tom, printbar kryssruta i stället för ifylld bock — ritas som fyrkant
   med CSS-border för att printa likadant oavsett teckensnittets glyfstöd.
   Tecknet U+2610 ligger i .cbox men döljs visuellt; rutan ritas här. */
ul.checklist li .cbox {{
  position:absolute; left:0; top:.7mm;
  width:3.6mm; height:3.6mm; box-sizing:border-box;
  border:.5pt solid var(--navy); border-radius:.6pt;
  font-size:0; line-height:0; color:transparent; overflow:hidden;
}}

/* Vanliga punktlistor */
ul.bullets {{ margin:0 0 9pt 0; padding-left:5mm; }}
ul.bullets li {{ margin-bottom:2.4mm; padding-left:2mm; }}
ul.bullets li::marker {{ color:var(--gold); }}

/* Faktaruta: roller */
.rolebox {{
  background:#fbfaf6; border:.6pt solid var(--line); border-radius:4pt;
  padding:7mm 8mm 5mm; margin:3mm 0 7mm; break-inside:avoid;
}}
.role {{ margin-bottom:4mm; }}
.role:last-child {{ margin-bottom:0; }}
.role-name {{
  display:block; font-family:'Inter'; font-weight:700; color:var(--teal);
  font-size:10.5pt; letter-spacing:.02em; margin-bottom:.5mm;
}}
.role-text {{ display:block; font-size:10.5pt; color:#3b454d; line-height:1.5; }}

/* Platshållare [EJ SKRIVET ÄNNU] */
.placeholder {{
  border:.8pt dashed #c4bda c; border:.8pt dashed #c7c0ad;
  border-radius:5pt; background:#faf8f2;
  padding:9mm 9mm; margin:4mm 0; text-align:center; break-inside:avoid;
}}
.placeholder-badge {{
  display:inline-block; font-family:'Inter'; font-weight:600;
  letter-spacing:.18em; text-transform:uppercase; font-size:8pt;
  color:var(--gold); border:.6pt solid var(--gold); border-radius:30pt;
  padding:1.3mm 4mm; margin-bottom:4mm;
}}
.placeholder-text {{
  font-family:'Fraunces'; font-style:italic; color:var(--muted);
  font-size:11pt; line-height:1.5;
}}

/* Ansvarsfriskrivning */
.disclaimer-page {{ }}
.disclaimer-body p {{ color:#3b454d; font-size:10.5pt; }}
'''

# fixa oavsiktligt blanksteg i placeholder-border (sanering)
CSS = CSS.replace("#c4bda c", "#c7c0ad")

html_doc = f'''<!DOCTYPE html>
<html lang="sv"><head><meta charset="utf-8">
<title>{html.escape(fm.get("titel",""))}</title>
<style>{CSS}</style></head>
<body>
{''.join(pages)}
</body></html>'''

OUT_HTML.write_text(html_doc, encoding="utf-8")
print("HTML skriven:", OUT_HTML)

# ---------------------------------------------------------------------------
# 6. Rendera PDF
# ---------------------------------------------------------------------------
from weasyprint import HTML
HTML(string=html_doc, base_url=str(BASE)).write_pdf(str(OUT_PDF))
print("PDF skriven:", OUT_PDF)
