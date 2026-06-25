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
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (!error && updated) {
    const reg = rowToRegistration(updated as Record<string, unknown>);

    const initials = reg.fullName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    // Insert into the lawyers directory; upsert avoids duplicates on re-approval
    const { error: lawyerError } = await db.from('lawyers').upsert(
      {
        name: 'Adv. ' + reg.fullName,
        city: reg.city,
        spec: reg.specializations[0] ?? 'General',
        exp: reg.experience + ' years',
        court: reg.court,
        phone: reg.phone,
        avatar: initials,
        verified: true,
      },
      { onConflict: 'phone,name' },
    );
    if (lawyerError) console.error('[lawyers upsert]', lawyerError.message);

    await sendEmail(
      reg.email,
      'MRA — Your Profile is Now Live! 🎉',
      `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#166534;">Congratulations! You are now live on MRA</h2>
        <p>Dear <strong>${reg.fullName}</strong>,</p>
        <p>Your lawyer profile has been approved and is now visible to thousands of citizens using MRA — My Rights App.</p>
        <p>Citizens can find you at: <strong>${reg.city}</strong> | <strong>${(reg.specializations || []).join(', ')}</strong></p>
        <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
      </div>`,
    );
  }

  return NextResponse.redirect(new URL(`/admin?key=${key}`, request.url), 303);
}
