import { supabaseServer } from '@/lib/supabase';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('phone')?.trim();
  if (!raw) {
    return Response.json({ error: 'phone is required' }, { status: 400 });
  }

  const phone = normalizePhone(raw);
  console.log('[chat-history] querying phone:', phone, '(raw:', raw, ')');

  const { data, error } = await supabaseServer()
    .from('chat_history')
    .select('id, question, response, lang, created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('[chat-history] query FAILED:', error.code, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log('[chat-history] returned', data?.length ?? 0, 'rows for phone:', phone);
  return Response.json({ messages: data ?? [] });
}
