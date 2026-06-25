import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.trim();
  if (!phone) {
    return Response.json({ error: 'phone is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from('chat_history')
    .select('id, question, response, lang, created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ messages: data ?? [] });
}
