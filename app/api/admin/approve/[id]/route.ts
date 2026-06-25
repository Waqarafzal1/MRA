import { NextResponse } from 'next/server';
import { loadData, saveData } from '@/lib/data';
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

  const data = loadData();
  const reg = data.registrations.find((r) => r.id === params.id);
  if (reg) {
    reg.status = 'approved';
    reg.approvedAt = new Date().toISOString();
    saveData(data);

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
