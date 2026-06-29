import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';

function unauthorized() {
  return new Response('Unauthorized', { status: 403 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';

  if (key !== adminPassword) return unauthorized();

  const { error } = await supabaseServer()
    .from('legal_news')
    .update({ status: 'approved' })
    .eq('id', params.id);

  if (error) {
    console.error('[news approve]', error.message);
    return new Response('Update failed', { status: 500 });
  }

  return NextResponse.redirect(new URL(`/admin/news?key=${key}`, request.url), 303);
}
