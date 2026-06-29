import { supabaseServer, rowToLawSection } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'what', 'when', 'where', 'who', 'why', 'how', 'if', 'i', 'me', 'my',
  'do', 'does', 'did', 'can', 'will', 'would', 'should', 'happens', 'happen',
]);

function termMatches(hay: string, term: string): boolean {
  if (hay.includes(term)) return true;
  if (term.endsWith('ed') && term.length > 4 && hay.includes(term.slice(0, -2))) return true;
  if (term.endsWith('ing') && term.length > 5 && hay.includes(term.slice(0, -3))) return true;
  return false;
}

function orderRpcResults(rows: Record<string, unknown>[], query: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ''))
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  const refHeading = (row: Record<string, unknown>) =>
    `${row.section_ref ?? ''} ${row.heading ?? ''}`.toLowerCase();

  const termHits = (row: Record<string, unknown>) =>
    terms.reduce((n, term) => n + (termMatches(refHeading(row), term) ? 1 : 0), 0);

  const maxHits = rows.reduce((max, row) => Math.max(max, termHits(row)), 0);
  if (maxHits === 0) return rows;

  return [...rows].sort((a, b) => {
    const hitDiff = termHits(b) - termHits(a);
    if (hitDiff !== 0) return hitDiff;

    const allMatch = (row: Record<string, unknown>) =>
      terms.every((term) => termMatches(refHeading(row), term));
    const allDiff = Number(allMatch(b)) - Number(allMatch(a));
    if (allDiff !== 0) return allDiff;

    const headingLen = (row: Record<string, unknown>) =>
      String(row.heading ?? '').length;
    return headingLen(a) - headingLen(b);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q) {
    return Response.json({ error: 'q is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer().rpc('search_law', {
    query_text: q,
  });

  if (error) {
    console.error('[search GET] search_law RPC:', error.message, error.code, error.details);
    return Response.json(
      {
        error: 'Search failed',
        ...(process.env.NODE_ENV === 'development' && { detail: error.message }),
      },
      { status: 500 },
    );
  }

  const rows = orderRpcResults((data ?? []) as Record<string, unknown>[], q);
  const results = rows.map((row) => rowToLawSection(row));
  return Response.json({ query: q, results });
}
