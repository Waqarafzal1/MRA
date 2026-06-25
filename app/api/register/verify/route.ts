import { loadData, saveData } from '@/lib/data';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { registrationId, otp } = await request.json();

  if (!registrationId || !otp) {
    return Response.json({ error: 'Registration ID and OTP required' }, { status: 400 });
  }

  const data = loadData();
  const pending = data.otps[registrationId];

  if (!pending) {
    return Response.json({ error: 'Registration not found. Please submit again.' }, { status: 404 });
  }
  if (Date.now() > pending.expiresAt) {
    delete data.otps[registrationId];
    saveData(data);
    return Response.json({ error: 'OTP expired. Please register again.' }, { status: 410 });
  }
  if (pending.otp !== String(otp).trim()) {
    return Response.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
  }

  const registration = { ...pending.registrationData, emailVerified: true };
  data.registrations.push(registration);
  delete data.otps[registrationId];
  saveData(data);

  const appUrl = process.env.APP_URL || 'https://mra-production-56be.up.railway.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';

  await sendEmail(
    process.env.EMAIL_USER || process.env.ADMIN_EMAIL || '',
    `MRA — New Lawyer Registration: ${registration.fullName}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#166534;">New Lawyer Registration — Pending Approval</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${Object.entries({
          'Full Name': registration.fullName,
          CNIC: registration.cnic,
          'License Number': registration.licenseNumber,
          'Bar Council': registration.barCouncil,
          City: registration.city,
          Court: registration.court,
          Experience: registration.experience + ' years',
          Phone: registration.phone,
          Email: registration.email,
          Specializations: registration.specializations.join(', '),
          Languages: registration.languages.join(', '),
          About: registration.about,
        })
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px;background:#f9fafb;font-weight:bold;border:1px solid #e5e7eb;width:35%">${k}</td><td style="padding:8px;border:1px solid #e5e7eb;">${v || '-'}</td></tr>`,
          )
          .join('')}
      </table>
      <div style="margin-top:20px;">
        <a href="${appUrl}/admin?key=${adminPassword}"
           style="background:#166534;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Review in Admin Panel
        </a>
      </div>
    </div>`,
  );

  await sendEmail(
    registration.email,
    'MRA — Registration Received',
    `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#166534;">MRA — My Rights App</h2>
      <p>Dear <strong>${registration.fullName}</strong>,</p>
      <p>Your registration has been received and your email has been verified. ✅</p>
      <p>Our team will review your credentials within <strong>2-3 business days</strong>. You will receive an email once your profile is approved and live on MRA.</p>
      <p style="color:#4b5563;font-size:13px;">Registration ID: <code>${registration.id}</code></p>
      <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
    </div>`,
  );

  return Response.json({
    success: true,
    message: 'Email verified! Your registration is under review. You will be notified within 2-3 business days.',
  });
}
