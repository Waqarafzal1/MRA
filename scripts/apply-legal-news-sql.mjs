/**
 * Apply legal_news DDL via DATABASE_URL in .env.local (optional).
 * Requires: npm install pg
 * Usage: node scripts/apply-legal-news-sql.mjs
 */
import { readFileSync } from 'fs';

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
const dbUrl = env.DATABASE_URL;
if (!dbUrl) {
  console.log('No DATABASE_URL in .env.local.');
  console.log('Paste supabase/legal_news.sql into Supabase → SQL editor and run it.');
  process.exit(0);
}

const sql = readFileSync('supabase/legal_news.sql', 'utf8');

try {
  const pg = await import('pg');
  const client = new pg.default.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('legal_news table ready.');
} catch (e) {
  if (e.code === 'ERR_MODULE_NOT_FOUND') {
    console.log('Install pg first: npm install pg');
  } else {
    console.error('SQL apply failed:', e.message);
  }
  process.exit(1);
}
