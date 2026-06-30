/**
 * Load Code of Criminal Procedure 1898 into legal_sections (CrPC rows only).
 * Upserts on (law_name, section_ref) — does not touch Constitution or PPC.
 *
 * Prerequisites:
 *   python3 extract_crpc.py   → crpc_sections.csv
 *
 * Usage:
 *   node scripts/ingest_crpc.mjs
 */
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
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

const LAW_NAME = 'Code of Criminal Procedure 1898';
const CSV_PATH = 'crpc_sections.csv';
const BATCH = 50;

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function toRow(record) {
  return {
    law_name: record.law_name,
    section_ref: record.section_ref,
    heading: record.heading ?? '',
    body: record.body,
    body_clean: record.body_clean,
    source: record.source,
    source_url: record.source_url,
    amended_up_to: record.amended_up_to,
    language: 'en',
  };
}

async function main() {
  const raw = readFileSync(CSV_PATH, 'utf8');
  const records = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
  console.log(`Read ${records.length} rows from ${CSV_PATH}`);

  const before = await supabase
    .from('legal_sections')
    .select('*', { count: 'exact', head: true })
    .eq('law_name', LAW_NAME);
  console.log(`Existing CrPC rows before ingest: ${before.count ?? 0}`);

  let upserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH).map(toRow);
    const { error } = await supabase.from('legal_sections').upsert(batch, {
      onConflict: 'law_name,section_ref',
    });
    if (error) {
      console.error('Upsert failed at batch', i, error.message);
      process.exit(1);
    }
    upserted += batch.length;
    process.stdout.write(`\rUpserted ${upserted}/${records.length}`);
  }
  console.log('\nDone.');

  const after = await supabase
    .from('legal_sections')
    .select('*', { count: 'exact', head: true })
    .eq('law_name', LAW_NAME);
  console.log(`CrPC rows after ingest: ${after.count ?? 0}`);

  const targets = ['22-A', '22-B', '154', '497', '491'];
  const { data: spot } = await supabase
    .from('legal_sections')
    .select('section_ref, heading, body_clean, amended_up_to, source_url')
    .eq('law_name', LAW_NAME)
    .in('section_ref', targets)
    .order('section_ref');

  console.log('\n--- Spot-check query results ---');
  for (const ref of targets) {
    const row = (spot ?? []).find((r) => r.section_ref === ref);
    if (!row) {
      console.log(`\n[${ref}] NOT FOUND`);
      continue;
    }
    console.log(`\n[${ref}] ${row.heading}`);
    console.log(`  amended_up_to: ${row.amended_up_to}`);
    console.log(`  source_url: ${row.source_url}`);
    console.log(`  body_clean (first 500 chars):\n${(row.body_clean ?? '').slice(0, 500)}`);
  }
}

main();
