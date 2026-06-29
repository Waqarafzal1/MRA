/**
 * Stage 1 local setup: ensure legal_news table exists and seed two test rows.
 * Usage: node scripts/setup-legal-news.mjs
 * Reads credentials from .env.local (never commit secrets).
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = readFileSync('.env.local', 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const sql = readFileSync('supabase/legal_news.sql', 'utf8');

async function ensureTable() {
  const { error: probe } = await supabase.from('legal_news').select('id').limit(1);
  if (!probe) return true;
  if (probe.code !== 'PGRST205' && !probe.message.includes('does not exist')) {
    console.error('Probe error:', probe.message);
    return false;
  }
  console.log('Table missing — apply supabase/legal_news.sql in Supabase SQL editor first.');
  console.log('Or run the SQL file contents manually, then re-run this script.');
  return false;
}

async function seed() {
  const rows = [
    {
      headline: 'TEST: Supreme Court hears bail reform petition',
      summary:
        'The court is reviewing whether bail rules should be simplified for minor offences. This is a test pending item for admin approval.',
      source_name: 'MRA Test Source',
      source_url: 'https://example.com/test-approved-flow',
      published_date: '2026-06-28',
      status: 'pending',
    },
    {
      headline: 'TEST: Reject me — labour wage dispute ruling',
      summary:
        'A test item that should stay hidden after you click Reject in the admin news panel.',
      source_name: 'MRA Test Source',
      source_url: 'https://example.com/test-reject-flow',
      published_date: '2026-06-27',
      status: 'pending',
    },
  ];

  for (const row of rows) {
    const { data: existing } = await supabase
      .from('legal_news')
      .select('id')
      .eq('headline', row.headline)
      .maybeSingle();
    if (existing) {
      console.log('Already exists:', row.headline.slice(0, 40) + '…');
      continue;
    }
    const { error } = await supabase.from('legal_news').insert(row);
    if (error) {
      console.error('Insert failed:', error.message);
      process.exit(1);
    }
    console.log('Inserted pending:', row.headline.slice(0, 50) + '…');
  }
}

async function main() {
  if (!(await ensureTable())) {
    process.exit(1);
  }
  await seed();
  console.log('\nNext: open /admin/news?key=<ADMIN_PASSWORD>, approve item 1, reject item 2.');
}

main();
