"""
Extract Code of Criminal Procedure 1898 from the verified FMU copy.

Source file: Code_of_criminal_procedure_1898.pdf
(No .docx found in project — this PDF matches the user's verified FMU source URL.)

Usage:
  python3 extract_crpc_fmu.py
  python3 ingest_crpc.py --delete-first
"""
import csv
import re
from collections import defaultdict
from pathlib import Path

import pdfplumber

PDF_PATH = "Code_of_criminal_procedure_1898.pdf"
LAW_NAME = "Code of Criminal Procedure 1898"
SOURCE = "Official CrPC (verified copy)"
SOURCE_URL = "https://www.fmu.gov.pk/docs/laws/Code_of_criminal_procedure_1898.pdf"
AMENDED_UP_TO = "2017-02-16"
OUTPUT_CSV = "crpc_sections.csv"
TOC_END_PAGE = 32
MIN_BODY_LEN = 30

SECTION_RE = re.compile(r"\n(\d+(?:-[A-Z]+)?)\.\s+")
OMITTED_RE = re.compile(r"\n(\d+(?:-[A-Z]+)?)\s+\(?(?:Repealed|Omitted|Repeated)", re.I)
TOC_LINE_RE = re.compile(r"^(\d+(?:-[A-Z]+)?)\.\s*(.*)$", re.I)


def normalize_section_ref(num: str) -> str:
    m = re.match(r"^(\d+)-([A-Z]+)$", num)
    if m:
        return num
    m = re.match(r"^(\d+)([A-Z]+)$", num)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return num


def parse_toc(pdf) -> dict[str, str]:
    toc_text = ""
    for i in range(min(TOC_END_PAGE, len(pdf.pages))):
        toc_text += (pdf.pages[i].extract_text() or "") + "\n"

    valid: dict[str, str] = {}
    current_num = None
    heading_parts: list[str] = []

    for raw_line in toc_text.split("\n"):
        line = raw_line.strip()
        if not line or line.startswith("Page ") or line.upper().startswith("PART "):
            continue
        if line.upper().startswith("CHAPTER"):
            continue
        if re.match(r"^[A-Z][.—-]", line):
            continue

        m = TOC_LINE_RE.match(line)
        if m:
            if current_num and heading_parts:
                valid[current_num] = " ".join(heading_parts)[:300]
            current_num = m.group(1).replace(" ", "")
            rest = m.group(2).strip().rstrip(".")
            heading_parts = [rest] if rest else []
        elif current_num and line and len(line) < 120:
            if not re.match(r"^\d", line) and not line.startswith("["):
                heading_parts.append(line.rstrip("."))

    if current_num and heading_parts:
        valid[current_num] = " ".join(heading_parts)[:300]

    return valid


def find_body_start(text: str) -> int:
    m = re.search(r"\n1\.\s+Short Title and Commencement:\s*\(1\)", text, re.I)
    if m:
        return m.start()
    m = re.search(r"\n1\.\s+Short title", text, re.I)
    return m.start() if m else 0


def is_false_section_match(text: str, start: int, num: str) -> bool:
    """Reject cross-reference line breaks like 'section\\n55.\\n(2)'."""
    after = text[start:]
    hdr = re.match(rf"\n{re.escape(num)}\.\s*", after)
    if not hdr:
        return False
    rest = after[hdr.end() :].lstrip()
    before = text[max(0, start - 60) : start]
    if re.search(r"\bsection\s*$", before, re.I) and re.match(r"^\(\d+\)", rest):
        return True
    header_part = rest.split("\n", 1)[0]
    if re.match(r"^\(\d+\)", header_part.strip()):
        if not re.search(r"[A-Za-z]{4,}.*:", header_part[:160]):
            return True
    return False


def extract_heading(num: str, chunk: str, toc_heading: str) -> str:
    line_m = re.match(rf"{re.escape(num)}\.\s*([^\n]+)", chunk)
    if not line_m:
        return toc_heading[:300]
    line = line_m.group(1).strip()
    if ":" in line:
        line = line.split(":", 1)[0].strip()
    line = re.split(r"\.\s*\(\d+\)", line)[0].strip().rstrip(".")
    if line and len(line) > 2:
        return line[:300]
    return toc_heading[:300]


def make_body_clean(body: str) -> str:
    text = body.replace("\u00ad", "").replace("\r\n", "\n")
    text = re.sub(r"Page \d+ of \d+", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def score_section_chunk(num: str, chunk: str, toc_heading: str) -> int:
    score = 0
    clean_len = len(make_body_clean(chunk))
    if clean_len >= MIN_BODY_LEN:
        score += 2
    if clean_len >= 80:
        score += 2
    heading = extract_heading(num, chunk, toc_heading)
    if toc_heading:
        toc_words = [w.lower() for w in re.findall(r"[A-Za-z]{4,}", toc_heading)[:6]]
        if toc_words and any(w in heading.lower() for w in toc_words):
            score += 5
    if re.search(r"\b(Repealed|Omitted|Rep\.)\b", chunk[:160]):
        score += 1
    if heading.lower().startswith("in ") and clean_len < 40:
        score -= 6
    if re.match(r"^\(\d+\)", chunk.split("\n", 1)[0].replace(f"{num}.", "").strip()):
        score -= 8
    return score


def flag_malformed(row: dict) -> list[str]:
    flags = []
    clean = row["body_clean"]
    if not row["heading"].strip():
        flags.append("no_heading")
    if len(clean) < MIN_BODY_LEN:
        flags.append("empty_or_short_body")
    if len(clean) > 30000:
        flags.append("suspiciously_long")
    return flags


def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        print(f"Source: {PDF_PATH} ({len(pdf.pages)} pages)")
        print("Note: No .docx found in project — using verified FMU PDF.")
        valid_map = parse_toc(pdf)
        valid_set = set(valid_map.keys())
        print(f"ToC entries: {len(valid_set)}")

        full_text = ""
        for idx in range(TOC_END_PAGE, len(pdf.pages)):
            full_text += (pdf.pages[idx].extract_text() or "") + "\n"

    body_start = find_body_start(full_text)
    full_text = full_text[body_start:]
    print(f"Body starts at offset {body_start}")

    sched = re.search(r"\nSCHEDULE I[\.\s-]", full_text)
    if sched:
        full_text = full_text[: sched.start()]
        print(f"Truncated before SCHEDULE I at {sched.start()}")

    candidates: dict[str, list[tuple[int, str]]] = defaultdict(list)
    false_positives = 0
    for m in SECTION_RE.finditer(full_text):
        num = m.group(1)
        if num in valid_set:
            if is_false_section_match(full_text, m.start(), num):
                false_positives += 1
                continue
            candidates[num].append((m.start(), "section"))
    for m in OMITTED_RE.finditer(full_text):
        num = m.group(1)
        if num in valid_set:
            candidates[num].append((m.start(), "omitted"))

    sorted_starts = sorted({s for starts in candidates.values() for s, _ in starts})

    def chunk_end(start: int) -> int:
        for s in sorted_starts:
            if s > start:
                return s
        return len(full_text)

    boundaries: list[tuple[int, str, str]] = []
    seen: dict[str, int] = {}
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
    print(f"Section boundaries: {len(boundaries)} (filtered {false_positives} false matches)")

    rows = []
    for i, (start, num, kind) in enumerate(boundaries):
        end = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(full_text)
        chunk = full_text[start:end].strip()
        if len(chunk) < 10 and kind != "omitted":
            continue

        ref = normalize_section_ref(num)
        toc_heading = valid_map.get(num, "")
        heading = extract_heading(num, chunk, toc_heading)
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

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "law_name",
                "section_ref",
                "heading",
                "body",
                "body_clean",
                "source",
                "source_url",
                "amended_up_to",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    refs = [r["section_ref"] for r in rows]
    print(f"\nExtracted {len(rows)} sections → {OUTPUT_CSV}")

    missing = sorted(normalize_section_ref(n) for n in valid_set if n not in seen)
    if missing:
        print(f"Missing from body ({len(missing)}): {', '.join(missing)}")

    print(f"\nAll section_refs ({len(refs)}):")
    print(", ".join(refs))

    malformed = [(r["section_ref"], flag_malformed(r), len(r["body_clean"])) for r in rows]
    malformed = [(ref, flags, ln) for ref, flags, ln in malformed if flags]
    if malformed:
        print(f"\nFLAGGED ({len(malformed)}):")
        for ref, flags, ln in malformed:
            print(f"  {ref}: {', '.join(flags)} (len={ln})")
    else:
        print("\nNo malformed sections flagged.")

    verify = ("22-A", "22-B", "154", "173", "497", "491")
    print("\n" + "=" * 72)
    print("VERIFICATION SECTIONS (body_clean)")
    print("=" * 72)
    for target in verify:
        row = next((r for r in rows if r["section_ref"] == target), None)
        print(f"\n### Section {target}")
        if not row:
            print("NOT FOUND")
            continue
        print(f"Heading: {row['heading']}")
        print(row["body_clean"])
        print("---")


if __name__ == "__main__":
    main()
