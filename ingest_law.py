import pdfplumber
import csv
import re
import sys

# ---- you edit these per law ----
PDF_PATH = "constitution.pdf"          # the official PDF you downloaded
LAW_NAME = "Constitution of Pakistan 1973"
SOURCE = "Pakistan Code"
SOURCE_URL = "https://pakistancode.gov.pk/english/..."  # the exact page
AMENDED_UP_TO = "2018-05-31"           # date printed on the official text
OUTPUT_CSV = "constitution_sections.csv"
# ---------------------------------

# 1. Pull all text out of the PDF
full_text = ""
with pdfplumber.open(PDF_PATH) as pdf:
    for page in pdf.pages:
        page_text = page.extract_text() or ""
        full_text += page_text + "\n"

# 2. Split into sections.
#    This regex looks for "Article 1." / "Article 2A." style markers.
#    You WILL need to tune this pattern to match how the PDF is laid out.
pattern = re.compile(r'(?=Article\s+\d+[A-Z]?\.)')
chunks = [c.strip() for c in pattern.split(full_text) if c.strip()]

rows = []
for chunk in chunks:
    # pull the "Article N" reference and a heading from the start of each chunk
    m = re.match(r'(Article\s+\d+[A-Z]?)\.\s*(.*?)(?:\n|$)', chunk, re.DOTALL)
    if not m:
        continue
    section_ref = m.group(1).strip()
    heading = m.group(2).strip()[:200]   # first line as a rough heading
    body = chunk

    rows.append({
        "law_name": LAW_NAME,
        "section_ref": section_ref,
        "heading": heading,
        "body": body,
        "source": SOURCE,
        "source_url": SOURCE_URL,
        "amended_up_to": AMENDED_UP_TO,
    })

# 3. Write the CSV for you to REVIEW before importing
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "law_name","section_ref","heading","body","source","source_url","amended_up_to"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Extracted {len(rows)} sections -> {OUTPUT_CSV}")
print("REVIEW the CSV against the official PDF before importing.")