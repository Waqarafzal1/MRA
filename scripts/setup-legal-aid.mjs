/**
 * Part 1 setup: ensure legal_aid table exists (apply SQL first) and seed verified entries.
 * Usage: node scripts/setup-legal-aid.mjs
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
const SEED_ROWS = JSON.parse(readFileSync('data/legal-aid-seed.json', 'utf8'));

async function ensureTable() {
  const { error: probe } = await supabase.from('legal_aid').select('id').limit(1);
  if (!probe) return true;
  if (probe.code !== 'PGRST205' && !probe.message.includes('does not exist')) {
    console.error('Probe error:', probe.message);
    return false;
  }
  console.log('Table missing — apply supabase/legal_aid.sql in Supabase SQL editor first.');
  console.log('Or add DATABASE_URL to .env.local and run: node scripts/apply-legal-aid-sql.mjs');
  return false;
}

async function seed() {
  for (const row of SEED_ROWS) {
    const { error } = await supabase.from('legal_aid').upsert(row, { onConflict: 'name' });
    if (error) {
      console.error('Upsert failed:', row.name, error.message);
      process.exit(1);
    }
    console.log('Upserted:', row.name);
  }
}

async function main() {
  if (!(await ensureTable())) {
    process.exit(1);
  }
  await seed();
  console.log('\nDone. Open http://localhost:3003/legal-aid to review the directory.');
}

main();
