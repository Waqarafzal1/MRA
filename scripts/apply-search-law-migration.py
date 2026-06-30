#!/usr/bin/env python3
"""Apply search_law migration (DDL only). Usage:
  DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres python3 scripts/apply-search-law-migration.py
"""
import os
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("pip3 install psycopg2-binary")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / "supabase/migrations/20250629120000_search_law_body_ranking.sql"


def load_env_url() -> str | None:
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    env_path = ROOT / ".env.local"
    if not env_path.is_file():
        return None
    for line in env_path.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip()
    return None


def main() -> None:
    db_url = load_env_url()
    if not db_url:
        print("Set DATABASE_URL in environment or .env.local")
        sys.exit(1)

    sql = SQL.read_text()
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    print("Applied search_law migration.")

    cur.execute(
        "SELECT section_ref, heading, rank FROM search_law(%s) LIMIT 5",
        ("police not register my fir first information report",),
    )
    print("Smoke test (top 5):")
    for ref, heading, rank in cur.fetchall():
        print(f"  {ref} — {heading[:50]} (rank {rank})")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
