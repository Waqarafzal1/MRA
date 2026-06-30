-- Free Legal Aid directory (Part 1 — verified entries, human approval via is_verified)
-- Run in Supabase SQL editor, or: node scripts/setup-legal-aid.mjs

CREATE TABLE IF NOT EXISTS legal_aid (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL UNIQUE,
  org_type       TEXT        NOT NULL
                             CHECK (org_type IN ('government', 'bar_committee', 'ngo', 'helpline')),
  helps_with     TEXT[]      NOT NULL DEFAULT '{}',
  who_qualifies  TEXT        NOT NULL,
  coverage       TEXT        NOT NULL,
  phone          TEXT,
  address        TEXT,
  website        TEXT,
  is_free        BOOLEAN     NOT NULL DEFAULT true,
  is_verified    BOOLEAN     NOT NULL DEFAULT false,
  source_url     TEXT        NOT NULL,
  last_verified  DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_aid_verified ON legal_aid (is_verified);
CREATE INDEX IF NOT EXISTS idx_legal_aid_coverage ON legal_aid (coverage);
CREATE INDEX IF NOT EXISTS idx_legal_aid_helps_with ON legal_aid USING GIN (helps_with);

INSERT INTO legal_aid (
  name, org_type, helps_with, who_qualifies, coverage,
  phone, address, website, is_free, is_verified, source_url
) VALUES
(
  'Legal Aid & Justice Authority',
  'government',
  ARRAY['criminal'],
  'Poor and vulnerable persons who cannot afford legal representation in criminal cases.',
  'national',
  NULL,
  'Ministry of Law and Justice, Islamabad',
  'https://www.molaw.gov.pk',
  true,
  false,
  'https://www.molaw.gov.pk'
),
(
  'Free Legal Help Helpline',
  'helpline',
  ARRAY['criminal', 'family', 'women', 'labour', 'property', 'consumer'],
  'Anyone seeking free legal information or guidance in Pakistan.',
  'national',
  '0800-46723',
  NULL,
  NULL,
  true,
  false,
  'https://www.ljcp.gov.pk'
),
(
  'District Legal Empowerment Committees',
  'government',
  ARRAY['criminal', 'family', 'property', 'consumer'],
  'Citizens at district level seeking free legal aid and dispute resolution support.',
  'district',
  NULL,
  'District courts and LJCP coordination offices nationwide',
  'https://www.ljcp.gov.pk',
  true,
  false,
  'https://www.ljcp.gov.pk'
),
(
  'Pakistan Bar Council Free Legal Aid Committees',
  'bar_committee',
  ARRAY['criminal', 'family', 'property', 'labour'],
  'Indigent litigants who cannot afford a lawyer; availability varies by province and district.',
  'National, provincial & district',
  NULL,
  'Pakistan Bar Council, Islamabad',
  'https://www.pbc.org.pk',
  true,
  false,
  'https://www.pbc.org.pk'
),
(
  'Legal Aid Society (LAS)',
  'ngo',
  ARRAY['criminal', 'family', 'women', 'labour', 'property'],
  'Low-income individuals and vulnerable groups in Karachi and Islamabad.',
  'Karachi & Islamabad',
  NULL,
  'Karachi and Islamabad offices',
  'https://las.org.pk',
  true,
  false,
  'https://las.org.pk'
),
(
  'AGHS Legal Aid Cell',
  'ngo',
  ARRAY['women', 'family', 'criminal'],
  'Women, children, and other vulnerable persons in need of legal assistance.',
  'Lahore',
  NULL,
  'Lahore',
  'https://www.aghs.org.pk',
  true,
  false,
  'https://www.aghs.org.pk'
),
(
  'PAWLA (Pakistan Women Lawyers Association)',
  'ngo',
  ARRAY['women', 'family'],
  'Women seeking legal support on family, domestic, and related matters.',
  'national',
  NULL,
  NULL,
  'https://www.pawla.org.pk',
  true,
  false,
  'https://www.pawla.org.pk'
),
(
  'Ansar Burney Trust',
  'ngo',
  ARRAY['criminal', 'women'],
  'Victims of human trafficking, illegal detention, and missing persons cases.',
  'national',
  NULL,
  'Karachi (head office)',
  'https://www.ansarburney.org',
  true,
  false,
  'https://www.ansarburney.org'
)
ON CONFLICT (name) DO UPDATE SET
  org_type = EXCLUDED.org_type,
  helps_with = EXCLUDED.helps_with,
  who_qualifies = EXCLUDED.who_qualifies,
  coverage = EXCLUDED.coverage,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  website = EXCLUDED.website,
  is_free = EXCLUDED.is_free,
  source_url = EXCLUDED.source_url;
