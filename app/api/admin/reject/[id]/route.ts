import { NextResponse } from 'next/server';
import { supabaseServer, rowToRegistration } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';

  if (key !== adminPassword) {
    return new Response('Unauthorized', { status: 403 });
  }

  const db = supabaseServer();

  const { data: updated, error } = await db
    .from('registrations')
    .update({ status: 'rejected', rejected_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (!error && updated) {
    const reg = rowToRegistration(updated as Record<string, unknown>);

    await sendEmail(
      reg.email,
      'MRA — Registration Update',
      `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#dc2626;">Registration Not Approved</h2>
        <p>Dear <strong>${reg.fullName}</strong>,</p>
        <p>Unfortunately we were unable to verify your credentials at this time. If you believe this is an error, please contact us with your Bar Council documentation.</p>
        <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
      </div>`,
    );
  }

  return NextResponse.redirect(new URL(`/admin?key=${key}`, request.url), 303);
}
