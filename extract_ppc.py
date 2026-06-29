import pdfplumber
import csv
import re

# ---- config ----
PDF_PATH       = "PPC.pdf"
LAW_NAME       = "Pakistan Penal Code 1860"
SOURCE         = "pakistani.org (compiled)"
SOURCE_URL     = "https://www.pakistani.org/pakistan/legislation/1860/actXLVof1860.html"
AMENDED_UP_TO  = "2016-01-01"   # pakistani.org's footnotes reference amendments through 2016; adjust if it states otherwise
OUTPUT_CSV     = "ppc_sections.csv"
MAX_SECTION    = 520   # PPC goes up to ~511; reject anything higher (footnote noise)
# ----------------

# ------------------------------------------------------------------
# The PPC PDF uses bare section numbers — no "Section N." prefix.
# Format: "\nN. Heading text.\nBody text"
# Lettered sections exist: 310A, 365B, 371B, 496A, 496B, 496C.
# Some section numbers appear twice (sub-list items, footnote refs,
# page-split duplicates) — we keep only the FIRST occurrence.
# ------------------------------------------------------------------

# 1. Extract all text
full_text = ""
with pdfplumber.open(PDF_PATH) as pdf:
    print(f"PDF has {len(pdf.pages)} pages")
    for page in pdf.pages:
        full_text += (page.extract_text() or "") + "\n"

# 2. Find all section boundaries; keep only first occurrence of each number.
# Two lettered-subsection formats exist in this PDF:
#   non-hyphenated: 310A, 365B, 496C  (matched by \d+[A-Z]*)
#   hyphenated:     295-A, 337-B, 489-F  (matched by \d+-[A-Z]+)
SECTION_RE = re.compile(r'\n(\d+(?:-[A-Z]+|[A-Z]*)?)\.[ \t]')

seen       = {}
boundaries = []

for m in SECTION_RE.finditer(full_text):
    num = m.group(1)
    numeric = int(re.match(r'\d+', num).group())   # strip letter/hyphen suffix
    if numeric > MAX_SECTION:
        continue
    if num not in seen:
        seen[num] = m.start()
        boundaries.append((m.start(), num))

boundaries.sort(key=lambda x: x[0])
print(f"Found {len(boundaries)} section boundaries")

# 3. Slice into per-section chunks
rows = []
for i, (start, num) in enumerate(boundaries):
    end   = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(full_text)
    chunk = full_text[start:end].strip()

    # First line of chunk: "N. Heading text." or "295-A. Heading text."
    first_line_m = re.match(r'(\d+(?:-[A-Z]+|[A-Z]*)?)\.[ \t]([^\n]+)', chunk)
    if not first_line_m:
        continue

    heading = first_line_m.group(2).strip().rstrip('.')
    body    = chunk

    if len(body) < 10:
        continue

    rows.append({
        "law_name":      LAW_NAME,
        "section_ref":   f"Section {num}",
        "heading":       heading[:300],
        "body":          body,
        "source":        SOURCE,
        "source_url":    SOURCE_URL,
        "amended_up_to": AMENDED_UP_TO,
    })

# 4. Write CSV
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "law_name", "section_ref", "heading", "body", "source", "source_url", "amended_up_to"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Extracted {len(rows)} sections → {OUTPUT_CSV}")
print("PPC should have ~511 sections. REVIEW the CSV before importing.")
