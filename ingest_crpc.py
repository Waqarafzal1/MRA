"""
Load crpc_sections.csv into legal_sections (CrPC only).
Deletes existing CrPC rows first when --delete-first is passed.

Usage (local Postgres):
  python3 extract_crpc_fmu.py
  python3 ingest_crpc.py --delete-first --postgres-url postgresql://postgres:postgres@127.0.0.1:54322/postgres

Usage (Supabase REST — reads .env.local):
  python3 ingest_crpc.py --delete-first
"""
from typing import Optional, Tuple
import csv
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

LAW_NAME = "Code of Criminal Procedure 1898"
CSV_PATH = "crpc_sections.csv"
BATCH = 50


def parse_args() -> Tuple[bool, Optional[str]]:
    delete_first = "--delete-first" in sys.argv
    postgres_url = None
    for i, arg in enumerate(sys.argv):
        if arg == "--postgres-url" and i + 1 < len(sys.argv):
            postgres_url = sys.argv[i + 1]
    return delete_first, postgres_url


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for line in Path(".env.local").read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def sb_request(url: str, key: str, method: str, path: str, data=None, extra_headers=None):
    endpoint = f"{url.rstrip('/')}/rest/v1/{path}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(endpoint, data=body, method=method, headers=headers)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else []


def count_law_sb(url: str, key: str, law_name: str) -> int:
    q = urllib.parse.urlencode({"select": "section_ref", "law_name": f"eq.{law_name}"})
    return len(sb_request(url, key, "GET", f"legal_sections?{q}"))


def delete_crpc_sb(url: str, key: str) -> None:
    q = urllib.parse.urlencode({"law_name": f"eq.{LAW_NAME}"})
    endpoint = f"{url.rstrip('/')}/rest/v1/legal_sections?{q}"
    req = urllib.request.Request(
        endpoint,
        method="DELETE",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(req) as resp:
        print(f"Deleted CrPC rows (HTTP {resp.status})")


def ingest_supabase(delete_first: bool) -> None:
    env = load_env()
    sb_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
        sys.exit(1)

    const_n = count_law_sb(sb_url, sb_key, "Constitution of Pakistan 1973")
    ppc_n = count_law_sb(sb_url, sb_key, "Pakistan Penal Code 1860")
    crpc_before = count_law_sb(sb_url, sb_key, LAW_NAME)
    print(f"Before: Constitution={const_n}, PPC={ppc_n}, CrPC={crpc_before}")

    if delete_first:
        delete_crpc_sb(sb_url, sb_key)

    records = read_csv()
    upserted = upsert_supabase(sb_url, sb_key, records)

    const_after = count_law_sb(sb_url, sb_key, "Constitution of Pakistan 1973")
    ppc_after = count_law_sb(sb_url, sb_key, "Pakistan Penal Code 1860")
    crpc_after = count_law_sb(sb_url, sb_key, LAW_NAME)
    print(f"After: Constitution={const_after}, PPC={ppc_after}, CrPC={crpc_after}")
    verify_other_laws(const_n, ppc_n, const_after, ppc_after)


def read_csv() -> list[dict]:
    if not Path(CSV_PATH).is_file():
        print(f"Missing {CSV_PATH} — run: python3 extract_crpc_fmu.py")
        sys.exit(1)
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        records = list(csv.DictReader(f))
    print(f"Read {len(records)} rows from {CSV_PATH}")
    return records


def upsert_supabase(sb_url: str, sb_key: str, records: list[dict]) -> int:
    upserted = 0
    for i in range(0, len(records), BATCH):
        batch = [row_payload(r) for r in records[i : i + BATCH]]
        try:
            sb_request(
                sb_url,
                sb_key,
                "POST",
                "legal_sections?on_conflict=law_name,section_ref",
                batch,
                {"Prefer": "resolution=merge-duplicates,return=minimal"},
            )
        except urllib.error.HTTPError as e:
            print(f"Upsert failed: {e.code} {e.read().decode()[:500]}")
            sys.exit(1)
        upserted += len(batch)
        print(f"Upserted {upserted}/{len(records)}")
    return upserted


def row_payload(r: dict) -> dict:
    return {
        "law_name": r["law_name"],
        "section_ref": r["section_ref"],
        "heading": r.get("heading") or "",
        "body": r["body"],
        "body_clean": r["body_clean"],
        "source": r["source"],
        "source_url": r["source_url"],
        "amended_up_to": r["amended_up_to"],
        "language": "en",
    }


def count_law_pg(cur, law_name: str) -> int:
    cur.execute("SELECT COUNT(*) FROM legal_sections WHERE law_name = %s", (law_name,))
    return cur.fetchone()[0]


def ingest_postgres(delete_first: bool, postgres_url: str) -> None:
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("Install psycopg2-binary: pip3 install psycopg2-binary")
        sys.exit(1)

    records = read_csv()

    try:
        conn = psycopg2.connect(postgres_url)
    except Exception as e:
        print(f"Cannot connect to Postgres: {e}")
        sys.exit(1)

    conn.autocommit = False
    cur = conn.cursor()

    const_n = count_law_pg(cur, "Constitution of Pakistan 1973")
    ppc_n = count_law_pg(cur, "Pakistan Penal Code 1860")
    crpc_before = count_law_pg(cur, LAW_NAME)
    print(f"Before: Constitution={const_n}, PPC={ppc_n}, CrPC={crpc_before}")

    if delete_first:
        cur.execute("DELETE FROM legal_sections WHERE law_name = %s", (LAW_NAME,))
        print(f"Deleted CrPC rows: {cur.rowcount}")

    upsert_sql = """
        INSERT INTO legal_sections (
            law_name, section_ref, heading, body, body_clean,
            source, source_url, amended_up_to, language
        ) VALUES %s
        ON CONFLICT (law_name, section_ref) DO UPDATE SET
            heading = EXCLUDED.heading,
            body = EXCLUDED.body,
            body_clean = EXCLUDED.body_clean,
            source = EXCLUDED.source,
            source_url = EXCLUDED.source_url,
            amended_up_to = EXCLUDED.amended_up_to,
            language = EXCLUDED.language
    """

    values = [
        (
            r["law_name"],
            r["section_ref"],
            r.get("heading") or "",
            r["body"],
            r["body_clean"],
            r["source"],
            r["source_url"],
            r["amended_up_to"],
            "en",
        )
        for r in records
    ]

    upserted = 0
    for i in range(0, len(values), BATCH):
        batch = values[i : i + BATCH]
        execute_values(cur, upsert_sql, batch)
        upserted += len(batch)
        print(f"Upserted {upserted}/{len(records)}")

    conn.commit()

    const_after = count_law_pg(cur, "Constitution of Pakistan 1973")
    ppc_after = count_law_pg(cur, "Pakistan Penal Code 1860")
    crpc_after = count_law_pg(cur, LAW_NAME)
    print(f"After: Constitution={const_after}, PPC={ppc_after}, CrPC={crpc_after}")

    cur.close()
    conn.close()
    verify_other_laws(const_n, ppc_n, const_after, ppc_after)


def verify_other_laws(const_n: int, ppc_n: int, const_after: int, ppc_after: int) -> None:
    if const_after != const_n or ppc_after != ppc_n:
        print("WARNING: Constitution or PPC row count changed!")
        sys.exit(1)
    print("Constitution and PPC counts unchanged.")


def main() -> None:
    delete_first, postgres_url = parse_args()
    if postgres_url:
        ingest_postgres(delete_first, postgres_url)
    else:
        ingest_supabase(delete_first)


if __name__ == "__main__":
    main()
