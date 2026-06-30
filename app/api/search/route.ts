import { supabaseServer, rowToLawSection } from '@/lib/supabase';
import {
  expandSearchQuery,
  extractSearchTerms,
  getSectionBoosts,
  type SectionBoost,
} from '@/lib/searchSynonyms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RESULTS = 10;

function termMatches(hay: string, term: string): boolean {
  if (hay.includes(term)) return true;
  if (term.endsWith('ed') && term.length > 4 && hay.includes(term.slice(0, -2))) return true;
  if (term.endsWith('ing') && term.length > 5 && hay.includes(term.slice(0, -3))) return true;
  return false;
}

function searchableText(row: Record<string, unknown>): string {
  const bodyClean = String(row.body_clean ?? '');
  const body = String(row.body ?? '');
  return `${row.section_ref ?? ''} ${row.heading ?? ''} ${bodyClean || body}`.toLowerCase();
}

function sectionBoostScore(row: Record<string, unknown>, boosts: SectionBoost[]): number {
  return boosts.reduce((sum, b) => {
    if (row.law_name === b.lawName && row.section_ref === b.sectionRef) {
      return sum + b.boost;
    }
    return sum;
  }, 0);
}

function scoreRow(
  row: Record<string, unknown>,
  terms: string[],
  boosts: SectionBoost[],
): number {
  const hay = searchableText(row);
  let hits = 0;
  for (const term of terms) {
    if (termMatches(hay, term)) hits += 1;
  }

  const refHeading = `${row.section_ref ?? ''} ${row.heading ?? ''}`.toLowerCase();
  let refHeadingHits = 0;
  for (const term of terms) {
    if (termMatches(refHeading, term)) refHeadingHits += 1;
  }

  const rpcRank = typeof row.rank === 'number' ? row.rank : Number(row.rank ?? 0);
  return hits * 2 + refHeadingHits + rpcRank * 0.25 + sectionBoostScore(row, boosts);
}

function orderRpcResults(
  rows: Record<string, unknown>[],
  query: string,
  expandedQuery: string,
): Record<string, unknown>[] {
  const terms = [
    ...new Set([
      ...extractSearchTerms(query),
      ...extractSearchTerms(expandedQuery),
    ]),
  ];
  const boosts = getSectionBoosts(query);

  if (terms.length === 0 && boosts.length === 0) return rows;

  const maxScore = rows.reduce(
    (max, row) => Math.max(max, scoreRow(row, terms, boosts)),
    0,
  );
  if (maxScore === 0) return rows;

  return [...rows].sort((a, b) => {
    const scoreDiff = scoreRow(b, terms, boosts) - scoreRow(a, terms, boosts);
    if (scoreDiff !== 0) return scoreDiff;

    const rpcDiff = Number(b.rank ?? 0) - Number(a.rank ?? 0);
    if (rpcDiff !== 0) return rpcDiff;

    return String(a.heading ?? '').length - String(b.heading ?? '').length;
  });
}

async function fetchMissingBoostSections(
  rows: Record<string, unknown>[],
  boosts: SectionBoost[],
): Promise<Record<string, unknown>[]> {
  if (boosts.length === 0) return rows;

  const missing = boosts.filter(
    (b) =>
      !rows.some(
        (r) => r.law_name === b.lawName && r.section_ref === b.sectionRef,
      ),
  );
  if (missing.length === 0) return rows;

  const fetched: Record<string, unknown>[] = [];
  for (const b of missing) {
    const { data, error } = await supabaseServer()
      .from('law_sections')
      .select('*')
      .eq('law_name', b.lawName)
      .eq('section_ref', b.sectionRef)
      .limit(1);
    if (error) {
      console.error('[search GET] boost section fetch:', error.message);
      continue;
    }
    if (data?.[0]) {
      fetched.push({ ...data[0], rank: 0 });
    }
  }

  return [...rows, ...fetched];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q) {
    return Response.json({ error: 'q is required' }, { status: 400 });
  }

  const expanded = expandSearchQuery(q);
  const boosts = getSectionBoosts(q);

  const { data, error } = await supabaseServer().rpc('search_law', {
    query_text: expanded,
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

  let rows = (data ?? []) as Record<string, unknown>[];
  rows = await fetchMissingBoostSections(rows, boosts);
  rows = orderRpcResults(rows, q, expanded).slice(0, MAX_RESULTS);

  const results = rows.map((row) => rowToLawSection(row));
  return Response.json({ query: q, results });
}
