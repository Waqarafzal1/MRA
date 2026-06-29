import pdfplumber
import csv
import re
from collections import defaultdict

# ---- config ----
PDF_PATH       = "consitution_2025.pdf"   # exact filename (note spelling in file)
LAW_NAME       = "Constitution of Pakistan 1973"
SOURCE         = "National Assembly of Pakistan"
SOURCE_URL     = "https://www.na.gov.pk/en/downloads.php"
AMENDED_UP_TO  = "2025-11-21"
OUTPUT_CSV     = "constitution_sections.csv"
# Pages 1-26 = cover + blanks + ToC + preamble.  Articles begin at page 27 (index 26).
SKIP_PAGES     = 26
# Schedules begin at page 211 (index 210) — stop here to avoid schedule item numbers
# being misread as article numbers.
END_PAGE       = 210
MAX_ARTICLE    = 280
# ----------------

# ------------------------------------------------------------------
# Layout: recto/verso book — margin column switches side each page.
#   Odd pages  (number on right): body x0 < 455, heading x0 >= 455
#   Even pages (number on left) : heading x0 < 150, body x0 >= 150
#
# Footnote superscripts appear as SEPARATE words just before the article
# number (different top coordinate by ~2 pt).  Using tight extraction
# tolerances (x_tol=1, y_tol=1) keeps them split.
#
# Three footnote prefix patterns in body text:
#   "1 1. …"    superscript digit + space + article number  (e.g. Article 1 → "1 1.")
#   "3[9A. …"   footnote-text bracket, e.g. "3[9A."         (e.g. Article 9A)
#   "1[46. …"   footnote-text bracket with bracket char      (e.g. Article 46)
# Clean articles: "38. …"  or  "38.\n…"
#
# Regex  (?:\d+[ \[])?  handles all prefix forms.
# ------------------------------------------------------------------

SPLIT_ODD_BODY  = 455
SPLIT_EVEN_HEAD = 150

# Matches article starts in concatenated body text; captures the real article number.
# (?:\d+[ \[])? = optional footnote prefix (digit then space or bracket)
# Prefix patterns seen in this PDF:
#   "1 1."   – superscript digit + space + article num
#   "1 [46." – superscript digit + space + bracket + article num
#   "[9A."   – lone bracket + article num
#   "[ [90." – bracket + space + bracket + article num
# (?:\d+[ \[]+|[ \[]+)? covers all: digit(s)+space/brackets OR pure space/brackets.
ARTICLE_RE = re.compile(r'\n(?:\d+[ \[]+|[ \[]+)?(\d+[A-Z]*)\.(?:[ \t]|\n)')

def extract_words_tight(page):
    return page.extract_words(x_tolerance=1, y_tolerance=1, keep_blank_chars=False)

def words_to_lines(word_list):
    """Reconstruct visual lines from word list (group by nearest 4pt bin)."""
    if not word_list:
        return []
    lines = defaultdict(list)
    for w in word_list:
        lines[round(w['top'] / 4) * 4].append(w)
    return [(y, ' '.join(w['text'] for w in sorted(lines[y], key=lambda w: w['x0'])))
            for y in sorted(lines)]

def page_columns(page):
    """Return (body_words, head_words) for a page based on its margin layout."""
    words = extract_words_tight(page)
    if any(w['x0'] >= SPLIT_ODD_BODY for w in words):   # odd page
        return (
            [w for w in words if w['x0'] <  SPLIT_ODD_BODY],
            [w for w in words if w['x0'] >= SPLIT_ODD_BODY],
        )
    else:                                                  # even page
        return (
            [w for w in words if w['x0'] >= SPLIT_EVEN_HEAD],
            [w for w in words if w['x0'] <  SPLIT_EVEN_HEAD],
        )

# Line-level regex: optional footnote prefix (digit space-or-bracket) then article number.
LINE_ARTICLE_RE = re.compile(r'^(?:\d+[ \[]+|[ \[]+)?(\d+[A-Z]*)\.(?:[ \t]|$)')

# ------------------------------------------------------------------
# PASS 1  collect body text + build heading_map
# ------------------------------------------------------------------
body_text   = ""
heading_map = {}   # article_num → heading string

with pdfplumber.open(PDF_PATH) as pdf:
    total = len(pdf.pages)
    print(f"PDF has {total} pages; processing pages {SKIP_PAGES+1}–{END_PAGE}")

    for page_idx in range(SKIP_PAGES, min(END_PAGE, total)):
        page = pdf.pages[page_idx]
        body_words, head_words = page_columns(page)

        body_lines = words_to_lines(body_words)
        head_lines = words_to_lines(head_words)

        page_body = '\n'.join(t for _, t in body_lines)
        body_text += '\n' + page_body

        # For each article start found on this page, find its heading
        for y, line_text in body_lines:
            m = LINE_ARTICLE_RE.match(line_text)
            if not m:
                continue
            num = m.group(1)
            if int(re.match(r'\d+', num).group()) > MAX_ARTICLE:
                continue
            if num in heading_map:
                continue   # already seen this article on a prior page

            # Nearest heading-column block at same y
            candidates = [(hy, ht) for hy, ht in head_lines if abs(hy - y) < 60]
            preferred  = [(hy, ht) for hy, ht in candidates if hy >= y - 8]
            chosen     = sorted(preferred if preferred else candidates, key=lambda x: x[0])

            if chosen:
                heading_lines = [chosen[0][1]]
                prev_y = chosen[0][0]
                # Stop when gap > 20pt OR current line ends with '.'
                # (each article heading ends with a period in this PDF)
                done = chosen[0][1].rstrip().endswith('.')
                for hy, ht in chosen[1:]:
                    if done or hy - prev_y > 20:
                        break
                    heading_lines.append(ht)
                    prev_y = hy
                    done = ht.rstrip().endswith('.')
                heading = ' '.join(heading_lines).rstrip('.')
                heading = re.sub(r'\s{2,}', ' ', heading).strip()
            else:
                heading = ""

            heading_map[num] = heading

# ------------------------------------------------------------------
# PASS 2  split body text into per-article chunks
# ------------------------------------------------------------------
seen       = {}
boundaries = []

for m in ARTICLE_RE.finditer(body_text):
    num = m.group(1)
    if int(re.match(r'\d+', num).group()) > MAX_ARTICLE:
        continue
    if num not in seen:
        seen[num] = m.start()
        boundaries.append((m.start(), num))

boundaries.sort(key=lambda x: x[0])
print(f"Found {len(boundaries)} article boundary markers")

rows = []
for i, (start, num) in enumerate(boundaries):
    end   = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(body_text)
    chunk = body_text[start:end].strip()

    # Strip leading footnote-corrupted number from body (e.g. "1 1." → "1.")
    chunk = re.sub(r'^(?:\d+[ \[]+|[ \[]+)?(\d+[A-Z]*)\.', lambda mo: f'{mo.group(1)}.', chunk)

    if len(chunk) < 20:
        continue

    rows.append({
        "law_name":      LAW_NAME,
        "section_ref":   f"Article {num}",
        "heading":       heading_map.get(num, "")[:300],
        "body":          chunk,
        "source":        SOURCE,
        "source_url":    SOURCE_URL,
        "amended_up_to": AMENDED_UP_TO,
    })

# ------------------------------------------------------------------
# PASS 3  write CSV
# ------------------------------------------------------------------
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "law_name", "section_ref", "heading", "body", "source", "source_url", "amended_up_to"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Extracted {len(rows)} articles → {OUTPUT_CSV}")
print("REVIEW the CSV against the official PDF before importing.")
