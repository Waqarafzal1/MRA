import { NextRequest, NextResponse } from 'next/server';
import {
  filterLegalAidItems,
  getLegalAidSeed,
  isLegalAidTableMissingError,
} from '@/lib/legal-aid-seed';
import { supabaseServer, rowToLegalAid } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public: free legal aid directory with optional filters. */
export async function GET(request: NextRequest) {
  const helpsWith = request.nextUrl.searchParams.get('helps_with')?.trim() || null;
  const coverage = request.nextUrl.searchParams.get('coverage')?.trim() || null;

  try {
    let query = supabaseServer()
      .from('legal_aid')
      .select('*')
      .order('name', { ascending: true });

    if (helpsWith) {
      query = query.contains('helps_with', [helpsWith]);
    }
    if (coverage) {
      query = query.eq('coverage', coverage);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[legal-aid GET]', error.message);

      if (isLegalAidTableMissingError(error.message)) {
        const items = filterLegalAidItems(getLegalAidSeed(), helpsWith, coverage);
        return NextResponse.json({ items, source: 'fallback' as const });
      }

      return NextResponse.json({ items: [], error: error.message, source: 'database' as const });
    }

    const items = (data ?? []).map((r) => rowToLegalAid(r as Record<string, unknown>));
    return NextResponse.json({ items, source: 'database' as const });
  } catch (err) {
    console.error('[legal-aid GET]', err);
    const items = filterLegalAidItems(getLegalAidSeed(), helpsWith, coverage);
    return NextResponse.json({ items, source: 'fallback' as const });
  }
}
