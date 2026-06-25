import { loadData } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const data = loadData();
  const approved = data.registrations
    .filter((r) => r.status === 'approved')
    .map((r) => ({
      name: 'Adv. ' + r.fullName,
      city: r.city,
      spec: r.specializations[0] || 'General',
      exp: r.experience + ' years',
      court: r.court,
      phone: r.phone,
      avatar: r.fullName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
      verified: true,
    }));
  return Response.json({ lawyers: approved });
}
