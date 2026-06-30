import csv
import re
import sys
from collections import defaultdict

import pdfplumber

# ---- config (Pakistan Code — official source metadata) ----
PDF_PATH = "CrPC.pdf"
LAW_NAME = "Code of Criminal Procedure 1898"
SOURCE = "Pakistan Code"
SOURCE_URL = (
    "https://pakistancode.gov.pk/english/"
    "UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lp-sg-jjjjjjjjjjjjj"
)
AMENDED_UP_TO = "2017-02-16"  # stated on PDF cover: "Last Amended on 2017-02-16"
OUTPUT_CSV = "crpc_sections.csv"
TOC_PAGES = 17          # pages 1–17 are cover + table of contents
MAX_SECTION_NUM = 565   # highest section number in ToC
MIN_BODY_LEN = 20
# -----------------------------------------------------------

# Section numbers in body text; optional footnote prefix (e.g. 3[156A. or 4[6.)
SECTION_RE = re.compile(r"\n(?:\d+[ \[]+|[ \[]+)?(\d+(?:[A-Z]+)?)\.[ \t\u00ad]")
OMITTED_RE = re.compile(r"\n(\d+(?:[A-Z]+)?)\s+Omitted\b[^\n]*")

TOC_LINE_RE = re.compile(r"^(\d+(?:[A-Z]+)?)\.\s*(.*)$")


def normalize_section_ref(num: str) -> str:
    """22A → 22-A; 154 → 154 (Pakistan Code lawyer-facing refs)."""
    m = re.match(r"^(\d+)-([A-Z]+)$", num)
    if m:
        return num
    m = re.match(r"^(\d+)([A-Z]+)$", num)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return num


def parse_toc(pdf) -> dict[str, str]:
    """Build whitelist of valid section numbers + rough headings from ToC."""
    toc_text = ""
    for i in range(min(TOC_PAGES, len(pdf.pages))):
        toc_text += (pdf.pages[i].extract_text() or "") + "\n"

    valid: dict[str, str] = {}
    current_num = None
    heading_parts: list[str] = []

    for raw_line in toc_text.split("\n"):
        line = raw_line.strip()
        if not line or line.startswith("Page ") or line.startswith("PART "):
            continue
        if line.startswith("CHAPTER") or line.startswith("SECTIONS"):
            continue
        if re.match(r"^[A-Z]\.", line):  # e.g. A.‑Classes of Criminal Courts
            continue

        m = TOC_LINE_RE.match(line)
        if m:
            if current_num and heading_parts:
                valid[current_num] = " ".join(heading_parts)[:300]
            current_num = m.group(1)
            numeric = int(re.match(r"\d+", current_num).group())
            if numeric > MAX_SECTION_NUM:
                current_num = None
                heading_parts = []
                continue
            rest = m.group(2).strip()
            heading_parts = [rest] if rest else []
        elif current_num and line and not line.startswith("["):
            # continuation line of ToC heading (e.g. "Commencement." under s.1)
            if len(line) < 120 and not re.match(r"^\d", line):
                heading_parts.append(line)

    if current_num and heading_parts:
        valid[current_num] = " ".join(heading_parts)[:300]

    return valid


def is_valid_section_num(num: str, valid: set[str]) -> bool:
    if num not in valid:
        return False
    if num.endswith("S"):  # footnote artifact e.g. 1S, 2S
        return False
    numeric = int(re.match(r"\d+", num).group())
    return 1 <= numeric <= MAX_SECTION_NUM


def find_body_start(text: str) -> int:
    """Skip cover pages / preamble footnotes before the operative s.1 text."""
    for m in re.finditer(r"\n1\. Short title", text):
        window = text[m.start() : m.start() + 500]
        if "1898" in window and ("commencement" in window.lower() or "come into force" in window.lower()):
            return m.start()
    m = re.search(r"\n1\. Short title", text)
    return m.start() if m else 0


def extract_heading_from_chunk(num: str, chunk: str, toc_heading: str) -> str:
    first = re.match(rf"{re.escape(num)}\.\s*([^\n]+)", chunk)
    if first:
        line = first.group(1).strip()
        line = line.replace("\u00ad", "")
        line = re.split(r"\.\s*(?:\(\d+\)|__)", line)[0].strip().rstrip(".")
        if line and len(line) > 3:
            return line[:300]
    return toc_heading[:300]


def unwrap_amendment_markers(text: str) -> str:
    """Turn 7[Any High Court] and nested 2[death or 3[life]] into readable substituted text."""
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"\d+\[([^\[\]]+)\]", r"\1", text)
        text = re.sub(r"\[([^\[\]]+)\]", r"\1", text)
    text = re.sub(r"\[\s*:\s*\]", "", text)
    text = re.sub(r"\]\s*:", ":", text)
    text = re.sub(r"\[\s*\]", "", text)
    # Unclosed markers in PDF (e.g. 4[Provided… bail [ : ]6 with no closing ])
    text = re.sub(r"\d+\[", "", text)
    text = re.sub(r"\s:\s*\d+\b", "", text)
    return text


def make_body_clean(body: str) -> str:
    text = body.replace("\u00ad", "")
    text = re.sub(r"Page \d+ of \d+", "", text)
    text = re.sub(r"https?://\S+", "", text)
    text = unwrap_amendment_markers(text)
    text = re.sub(r"\n\d+S\b.*", "", text)
    # Orphan footnote digits before words: "of 2an offence" → "of an offence"
    text = re.sub(r"\s\d+(?=[a-z])", " ", text)
    # PDF line-break merges: Courtmay → Court may
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def score_section_chunk(num: str, chunk: str, toc_heading: str) -> int:
    """Prefer substantive sections over preamble footnote lines (e.g. s.3 'In Sind…')."""
    score = 0
    clean_len = len(make_body_clean(chunk))
    if clean_len >= MIN_BODY_LEN:
        score += 2
    if clean_len >= 80:
        score += 2
    heading = extract_heading_from_chunk(num, chunk, toc_heading)
    if toc_heading:
        toc_words = [w.lower() for w in re.findall(r"[A-Za-z]{4,}", toc_heading)[:6]]
        if toc_words and any(w in heading.lower() for w in toc_words):
            score += 4
    if re.search(r"\b(Repealed|Omitted|Rep\.)", chunk[:120]):
        score += 1
    if re.search(r"\b(19|20)\d{2}\b", heading) and clean_len < 40:
        score -= 6
    if heading.lower().startswith("in ") and clean_len < 40:
        score -= 6
    return score


def flag_malformed(row: dict) -> list[str]:
    flags = []
    body = row["body"]
    clean = row["body_clean"]
    if not row["heading"].strip():
        flags.append("no_heading")
    if len(clean) < MIN_BODY_LEN:
        flags.append("empty_or_short_body")
    if len(clean) > 25000:
        flags.append("suspiciously_long")
    if re.search(r"Page \d+ of \d+", clean):
        flags.append("page_footer_in_clean")
    if body.count("\n") < 1 and len(clean) > 400:
        flags.append("possible_merge")
    return flags


def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"PDF has {len(pdf.pages)} pages")
        valid_map = parse_toc(pdf)
        valid_set = set(valid_map.keys())
        print(f"ToC whitelist: {len(valid_set)} section numbers")

        full_text = ""
        for idx in range(TOC_PAGES, len(pdf.pages)):
            full_text += (pdf.pages[idx].extract_text() or "") + "\n"

    # Stop before schedules (prevents s.561 swallowing the rest of the PDF)
    sched = re.search(r"\nSCHEDULE I[\.\s]", full_text)
    if sched:
        full_text = full_text[: sched.start()]
        print(f"Truncated body text at SCHEDULE I (char {sched.start()})")

    body_start = find_body_start(full_text)
    full_text = full_text[body_start:]
    print(f"Body scan starts at char {body_start} (after operative s.1)")

    # Collect all candidate starts per section; pick best (not first) match.
    candidates: dict[str, list[tuple[int, str]]] = defaultdict(list)

    for m in SECTION_RE.finditer(full_text):
        num = m.group(1)
        if is_valid_section_num(num, valid_set):
            candidates[num].append((m.start(), "section"))

    for m in OMITTED_RE.finditer(full_text):
        num = m.group(1)
        if is_valid_section_num(num, valid_set):
            candidates[num].append((m.start(), "omitted"))

    boundaries: list[tuple[int, str, str]] = []
    seen: dict[str, int] = {}

    sorted_starts = sorted({s for starts in candidates.values() for s, _ in starts})

    def chunk_end(start: int) -> int:
        for s in sorted_starts:
            if s > start:
                return s
        return len(full_text)

    for num, starts in candidates.items():
        toc_heading = valid_map.get(num, "")
        best_start, best_kind, best_score = starts[0][0], starts[0][1], -999
        for start, kind in starts:
            end = chunk_end(start)
            chunk = full_text[start:end].strip()
            sc = score_section_chunk(num, chunk, toc_heading)
            if sc > best_score:
                best_score = sc
                best_start = start
                best_kind = kind
        seen[num] = best_start
        boundaries.append((best_start, num, best_kind))

    boundaries.sort(key=lambda x: x[0])
    print(f"Found {len(boundaries)} section boundaries in body text")

    rows = []
    for i, (start, num, kind) in enumerate(boundaries):
        end = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(full_text)
        chunk = full_text[start:end].strip()
        if len(chunk) < MIN_BODY_LEN and kind != "omitted":
            continue

        # Strip footnote prefix from chunk start (3[156A. → 156A.)
        chunk = re.sub(
            r"^(?:\d+[ \[]+|[ \[]+)?(\d+(?:[A-Z]+)?)\.",
            lambda mo: f"{mo.group(1)}.",
            chunk,
            count=1,
        )

        ref = normalize_section_ref(num)
        toc_heading = valid_map.get(num, "")
        heading = extract_heading_from_chunk(num, chunk, toc_heading)
        body_clean = make_body_clean(chunk)

        rows.append(
            {
                "law_name": LAW_NAME,
                "section_ref": ref,
                "heading": heading,
                "body": chunk,
                "body_clean": body_clean,
                "source": SOURCE,
                "source_url": SOURCE_URL,
                "amended_up_to": AMENDED_UP_TO,
            }
        )

    fieldnames = [
        "law_name",
        "section_ref",
        "heading",
        "body",
        "body_clean",
        "source",
        "source_url",
        "amended_up_to",
    ]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Extracted {len(rows)} sections → {OUTPUT_CSV}")
    print(f"Expected ~{len(valid_set)} from ToC.")

    missing = sorted(
        normalize_section_ref(n) for n in valid_set if n not in seen
    )
    if missing:
        print(f"\nMISSING from body ({len(missing)}): {missing[:30]}{'…' if len(missing)>30 else ''}")

    refs = [r["section_ref"] for r in rows]
    print(f"\nAll section_refs ({len(refs)}):")
    print(", ".join(refs))

    malformed = []
    for r in rows:
        flags = flag_malformed(r)
        if flags:
            malformed.append((r["section_ref"], flags, len(r["body_clean"])))

    if malformed:
        print(f"\nFLAGGED for review ({len(malformed)}):")
        for ref, flags, blen in malformed:
            print(f"  {ref}: {', '.join(flags)} (body_clean len={blen})")
    else:
        print("\nNo malformed sections flagged.")

    # Spot-check targets
    print("\nSpot-check targets:")
    for target in ("22-A", "22-B", "154", "497", "491"):
        match = next((r for r in rows if r["section_ref"] == target), None)
        if match:
            print(f"  {target}: {match['heading'][:80]}… ({len(match['body_clean'])} chars clean)")
        else:
            print(f"  {target}: NOT FOUND")


if __name__ == "__main__":
    main()
