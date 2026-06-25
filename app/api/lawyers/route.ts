import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseServer()
    .from('lawyers')
    .select('name, city, spec, exp, court, phone, avatar, verified')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[lawyers GET]', error.message);
    return Response.json({ lawyers: [] });
  }
  return Response.json({ lawyers: data ?? [] });
}
