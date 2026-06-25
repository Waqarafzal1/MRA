import { v4 as uuidv4 } from 'uuid';
import { supabaseServer } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const {
    fullName, cnic, licenseNumber, barCouncil, specializations,
    city, court, experience, phone, email, languages, about,
  } = body;

  const required: Record<string, string> = {
    fullName, cnic, licenseNumber, barCouncil, city, phone, email,
  };
  for (const [key, val] of Object.entries(required)) {
    if (!val || !String(val).trim()) {
      return Response.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  if (!/^\d{13}$/.test(String(cnic).replace(/-/g, ''))) {
    return Response.json({ error: 'CNIC must be 13 digits' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (!/^(\+92|0)?[0-9]{10,11}$/.test(String(phone).replace(/[\s-]/g, ''))) {
    return Response.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  const licenseNumberClean = String(licenseNumber).trim();
  const emailClean = String(email).toLowerCase().trim();
  const db = supabaseServer();

  // Check for duplicates on license number and email separately to avoid
  // PostgREST filter-string encoding issues with special characters in email.
  const [{ data: byLicense }, { data: byEmail }] = await Promise.all([
    db.from('registrations').select('id').eq('license_number', licenseNumberClean).limit(1),
    db.from('registrations').select('id').eq('email', emailClean).limit(1),
  ]);

  if ((byLicense?.length ?? 0) > 0 || (byEmail?.length ?? 0) > 0) {
    return Response.json(
      { error: 'A registration with this license number or email already exists.' },
      { status: 409 },
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const registrationId = uuidv4();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  // Store the registration data as camelCase JSONB so the verify route can
  // read it back as a Registration object without any conversion.
  const registrationData = {
    id: registrationId,
    fullName: String(fullName).trim(),
    cnic: String(cnic).replace(/-/g, ''),
    licenseNumber: licenseNumberClean,
    barCouncil,
    specializations: Array.isArray(specializations)
      ? specializations
      : [specializations].filter(Boolean),
    city,
    court: court?.trim() || '',
    experience: parseInt(experience) || 0,
    phone: String(phone).trim(),
    email: emailClean,
    languages: Array.isArray(languages) ? languages : [languages].filter(Boolean),
    about: about?.trim() || '',
    status: 'pending',
    emailVerified: false,
    submittedAt: new Date().toISOString(),
  };

  const { error: otpError } = await db.from('pending_otps').insert({
    id: registrationId,
    otp,
    expires_at: expiresAt,
    registration_data: registrationData,
  });

  if (otpError) {
    console.error('[pending_otps insert]', otpError.message);
    return Response.json(
      { error: 'Failed to store registration. Please try again.' },
      { status: 500 },
    );
  }

  await sendEmail(
    email,
    'MRA — Verify Your Email (OTP)',
    `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#166534;">MRA — My Rights App</h2>
      <p>Dear <strong>${fullName}</strong>,</p>
      <p>Thank you for registering as a lawyer on MRA. Please verify your email using the OTP below:</p>
      <div style="background:#dcfce7;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
        <div style="font-size:36px;font-weight:bold;color:#166534;letter-spacing:8px;">${otp}</div>
        <p style="color:#4b5563;font-size:13px;">This OTP expires in 15 minutes</p>
      </div>
      <p style="color:#4b5563;font-size:13px;">If you did not register on MRA, ignore this email.</p>
      <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
    </div>`,
  );

  return Response.json({
    success: true,
    registrationId,
    message: 'OTP sent to your email. Please check your inbox.',
  });
}
