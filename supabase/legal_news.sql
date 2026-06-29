-- Legal news queue (Stage 1 — manual / pending approval)
-- Run in Supabase SQL editor, or: node scripts/setup-legal-news.mjs

CREATE TABLE IF NOT EXISTS legal_news (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  headline       TEXT        NOT NULL,
  summary        TEXT        NOT NULL,
  source_name    TEXT        NOT NULL,
  source_url     TEXT        NOT NULL,
  published_date DATE        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_news_status_published
  ON legal_news (status, published_date DESC);

-- Public read: approved items only (via API using service role)
-- No RLS for Stage 1 — server routes gate writes; public fetch is approved-only in code.
