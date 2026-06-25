-- =============================================================================
-- MRA — My Rights App
-- Supabase schema: paste this entire file into the Supabase SQL editor and run.
-- All statements are idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- =============================================================================

-- Required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- TABLE: chat_history
-- One row per Q&A pair. Users are identified only by phone number.
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT        NOT NULL,
  question   TEXT        NOT NULL,
  response   TEXT        NOT NULL,
  lang       TEXT        NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup of all messages for a given phone number
CREATE INDEX IF NOT EXISTS idx_chat_history_phone
  ON chat_history (phone);

-- Same lookup but already sorted newest-first (used by the chat-history fetch)
CREATE INDEX IF NOT EXISTS idx_chat_history_phone_created
  ON chat_history (phone, created_at DESC);


-- =============================================================================
-- TABLE: registrations
-- Mirrors the Registration interface in lib/types.ts exactly.
-- =============================================================================
CREATE TABLE IF NOT EXISTS registrations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        TEXT        NOT NULL,
  cnic             TEXT        NOT NULL,
  license_number   TEXT        NOT NULL UNIQUE,
  bar_council      TEXT        NOT NULL,
  specializations  TEXT[]      NOT NULL DEFAULT '{}',
  city             TEXT        NOT NULL,
  court            TEXT        NOT NULL DEFAULT '',
  experience       INTEGER     NOT NULL DEFAULT 0,
  phone            TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  languages        TEXT[]      NOT NULL DEFAULT '{}',
  about            TEXT        NOT NULL DEFAULT '',
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  email_verified   BOOLEAN     NOT NULL DEFAULT false,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at      TIMESTAMPTZ,
  rejected_at      TIMESTAMPTZ
);

-- Filter registrations by approval status (admin panel queries)
CREATE INDEX IF NOT EXISTS idx_registrations_status
  ON registrations (status);

-- Duplicate-check on email during new submissions
CREATE INDEX IF NOT EXISTS idx_registrations_email
  ON registrations (email);

-- Duplicate-check on license number during new submissions
CREATE INDEX IF NOT EXISTS idx_registrations_license_number
  ON registrations (license_number);


-- =============================================================================
-- TABLE: pending_otps
-- Replaces the in-memory otps map in lib/data.ts.
-- Rows are deleted once the OTP is consumed or the session expires.
-- =============================================================================
CREATE TABLE IF NOT EXISTS pending_otps (
  id                UUID    PRIMARY KEY,
  otp               TEXT    NOT NULL,
  expires_at        BIGINT  NOT NULL,
  registration_data JSONB   NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- TABLE: lawyers
-- Mirrors the Lawyer interface in lib/types.ts.
-- Seeded with DEMO_LAWYERS from lib/lawyers-data.ts.
-- Approved registrations are also inserted here by the approve route.
-- =============================================================================
CREATE TABLE IF NOT EXISTS lawyers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  city       TEXT        NOT NULL,
  spec       TEXT        NOT NULL,
  exp        TEXT        NOT NULL,
  court      TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  avatar     TEXT        NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_lawyers_phone_name UNIQUE (phone, name)
);

-- Filter lawyers by city (LawyersTab city dropdown)
CREATE INDEX IF NOT EXISTS idx_lawyers_city
  ON lawyers (city);

-- Filter lawyers by specialization (LawyersTab spec dropdown)
CREATE INDEX IF NOT EXISTS idx_lawyers_spec
  ON lawyers (spec);


-- =============================================================================
-- SEED: demo lawyers (20 rows, all 8 value columns explicit)
-- ON CONFLICT DO NOTHING makes this safe to re-run.
-- =============================================================================
INSERT INTO lawyers (name,                    city,         spec,              exp,        court,                        phone,          avatar, verified) VALUES
  ('Adv. Sara Malik',      'Lahore',     'Family Law',      '12 years', 'Lahore High Court',          '0300-1234567', 'SM',   false),
  ('Adv. Bilal Ahmed',     'Lahore',     'Criminal Law',    '8 years',  'Sessions Court Lahore',      '0321-9876543', 'BA',   false),
  ('Adv. Nadia Khan',      'Lahore',     'Women''s Rights', '10 years', 'Family Court Lahore',        '0333-5551234', 'NK',   false),
  ('Adv. Tariq Hussain',   'Lahore',     'Property Law',    '15 years', 'Civil Court Lahore',         '0345-7774321', 'TH',   false),
  ('Adv. Kamran Iqbal',    'Karachi',    'Corporate Law',   '18 years', 'Sindh High Court',           '0300-2223344', 'KI',   false),
  ('Adv. Fatima Zaidi',    'Karachi',    'Family Law',      '7 years',  'Family Court Karachi',       '0321-1112233', 'FZ',   false),
  ('Adv. Hassan Mirza',    'Karachi',    'Criminal Law',    '11 years', 'Sessions Court Karachi',     '0333-6667788', 'HM',   false),
  ('Adv. Zara Siddiqui',   'Karachi',    'Cybercrime',      '5 years',  'Sindh High Court',           '0301-9998877', 'ZS',   false),
  ('Adv. Usman Chaudhry',  'Islamabad',  'Property Law',    '13 years', 'Islamabad High Court',       '0300-5556677', 'UC',   false),
  ('Adv. Mehwish Ali',     'Islamabad',  'Women''s Rights', '9 years',  'Family Court Islamabad',     '0345-3334455', 'MA',   false),
  ('Adv. Asif Raza',       'Islamabad',  'Criminal Law',    '14 years', 'Islamabad High Court',       '0321-7778899', 'AR',   false),
  ('Adv. Sana Javed',      'Rawalpindi', 'Family Law',      '6 years',  'Family Court Rawalpindi',    '0333-2221133', 'SJ',   false),
  ('Adv. Rizwan Shah',     'Rawalpindi', 'Labour Law',      '10 years', 'Labour Court Rawalpindi',    '0300-4445566', 'RS',   false),
  ('Adv. Aqsa Bhatti',     'Faisalabad', 'Family Law',      '8 years',  'Family Court Faisalabad',    '0321-8889900', 'AB',   false),
  ('Adv. Naveed Rana',     'Faisalabad', 'Labour Law',      '12 years', 'Labour Court Faisalabad',    '0333-1114422', 'NR',   false),
  ('Adv. Bushra Qureshi',  'Multan',     'Property Law',    '16 years', 'Civil Court Multan',         '0300-6663311', 'BQ',   false),
  ('Adv. Irfan Malik',     'Multan',     'Criminal Law',    '9 years',  'Sessions Court Multan',      '0345-2227788', 'IM',   false),
  ('Adv. Rukhsana Yusuf',  'Peshawar',   'Women''s Rights', '11 years', 'Peshawar High Court',        '0321-9990011', 'RY',   false),
  ('Adv. Zahid Khan',      'Peshawar',   'Criminal Law',    '20 years', 'Peshawar High Court',        '0333-5558866', 'ZK',   false),
  ('Adv. Mariam Baloch',   'Quetta',     'Family Law',      '7 years',  'Family Court Quetta',        '0300-7771199', 'MB',   false)
ON CONFLICT (phone, name) DO NOTHING;
