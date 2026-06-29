import { NextResponse } from 'next/server';
import { supabaseServer, rowToLegalNews } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Public: approved legal news only, newest first, max 5. */
export async function GET() {
  try {
    const { data, error } = await supabaseServer()
      .from('legal_news')
      .select('*')
      .eq('status', 'approved')
      .order('published_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[legal-news GET]', error.message);
      return NextResponse.json({ items: [] });
    }

    const items = (data ?? []).map((r) => rowToLegalNews(r as Record<string, unknown>));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[legal-news GET]', err);
    return NextResponse.json({ items: [] });
  }
}
