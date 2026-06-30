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

    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'api/legal-aid/route.ts:GET',message:'supabase query result',data:{helpsWith,coverage,errorMessage:error?.message??null,rowCount:data?.length??0,tableMissing:error?isLegalAidTableMissingError(error.message):false},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('[legal-aid GET]', error.message);

      if (isLegalAidTableMissingError(error.message)) {
        const items = filterLegalAidItems(getLegalAidSeed(), helpsWith, coverage);
        // #region agent log
        fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'api/legal-aid/route.ts:fallback',message:'serving seed fallback',data:{itemCount:items.length,helpsWith,coverage},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        return NextResponse.json({ items, source: 'fallback' as const });
      }

      return NextResponse.json({ items: [], error: error.message, source: 'database' as const });
    }

    const items = (data ?? []).map((r) => rowToLegalAid(r as Record<string, unknown>));
    return NextResponse.json({ items, source: 'database' as const });
  } catch (err) {
    console.error('[legal-aid GET]', err);
    const items = filterLegalAidItems(getLegalAidSeed(), helpsWith, coverage);
    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'api/legal-aid/route.ts:catch',message:'exception fallback',data:{itemCount:items.length,err:String(err)},timestamp:Date.now(),hypothesisId:'B',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ items, source: 'fallback' as const });
  }
}
