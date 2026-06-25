import { loadData } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const data = loadData();
  return Response.json({
    status: 'ok',
    service: 'MRA - My Rights App',
    ai: !!process.env.ANTHROPIC_API_KEY,
    email: !!process.env.EMAIL_USER,
    whatsapp: !!process.env.TWILIO_ACCOUNT_SID,
    registrations: data.registrations.length,
    pending: data.registrations.filter((r) => r.status === 'pending').length,
    approved: data.registrations.filter((r) => r.status === 'approved').length,
  });
}
