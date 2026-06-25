require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Serve static files from /public OR root (whichever exists)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────
// DATA STORAGE (JSON file)
// ─────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'registrations.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { console.error('Load error:', e.message); }
  return { registrations: [], otps: {} };
}

function saveData(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('Save error:', e.message); }
}

// ─────────────────────────────────────────────
// EMAIL SETUP (Nodemailer + Gmail)
// ─────────────────────────────────────────────
function getMailer() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
  });
}

async function sendEmail(to, subject, html) {
  const mailer = getMailer();
  if (!mailer) { console.log('Email not configured — skipping send to', to); return; }
  try {
    await mailer.sendMail({ from: `"MRA My Rights App" <${process.env.EMAIL_USER}>`, to, subject, html });
    console.log('Email sent to', to);
  } catch (e) { console.error('Email error:', e.message); }
}

// ─────────────────────────────────────────────
// AI SYSTEM PROMPT
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are MRA (My Rights App — میرے حقوق ایپ), a legal information assistant specializing in Pakistani law. Help ordinary Pakistani citizens understand their legal rights in simple, plain language.

ALWAYS:
- Cite the specific Pakistani law/act/section
- Give practical, actionable advice (which court, which authority, what document)
- End every response with: "For your specific situation, consult a qualified lawyer."
- Detect language (Urdu or English) and respond in the SAME language
- Keep responses under 300 words
- Use simple everyday language

COVER: Police/FIR rights, Bail/Arrest, Family law, Property/Rent, Labour rights, Consumer rights, Inheritance, Cybercrime (PECA 2016), Women's rights, Education rights, Traffic law, Land/Agriculture law.

DO NOT provide specific legal advice for particular cases.`;

// ─────────────────────────────────────────────
// AI ENDPOINT — Streaming
// ─────────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  const { message, language } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'AI not configured' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const langHint = language === 'ur'
      ? 'User selected Urdu. Respond in Urdu (Nastaliq script).'
      : 'User selected English. Respond in English.';

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${langHint}\n\nQuestion: ${message}` }]
    });

    stream.on('text', t => res.write(`data: ${JSON.stringify({ text: t })}\n\n`));
    stream.on('message', () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
    stream.on('error', () => { res.write(`data: ${JSON.stringify({ error: 'AI error' })}\n\n`); res.end(); });
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'Connection failed' })}\n\n`);
    res.end();
  }
});

// ─────────────────────────────────────────────
// WHATSAPP WEBHOOK (Twilio)
// ─────────────────────────────────────────────
app.post('/api/ask-simple', async (req, res) => {
  const { message, lang } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'AI not configured' });
  try {
    const langHint = lang === 'ur' ? 'Respond in Urdu (Nastaliq script).' : 'Respond in English.';
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${langHint}\n\nQuestion: ${message}` }]
    });
    res.json({ response: response.content[0].text });
  } catch (e) { res.status(500).json({ error: 'AI error' }); }
});
app.post('/webhook/whatsapp', async (req, res) => {
  const msg = (req.body.Body || '').trim();
  function reply(text) {
    const safe = text.length > 1550 ? text.substring(0, 1550) + '...' : text;
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${safe.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Body></Message></Response>`);
  }

  if (!msg) return reply('Welcome to MRA — My Rights App. Type your legal question in Urdu or English.\n\nMRA میں خوش آمدید۔ اپنا قانونی سوال لکھیں۔');
  if (!process.env.ANTHROPIC_API_KEY) return reply('Service temporarily unavailable.');

  try {
    const hasUrdu = /[؀-ۿ]/.test(msg);
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${hasUrdu ? 'Respond in Urdu.' : 'Respond in English.'}\n\nQuestion: ${msg}` }]
    });
    reply(response.content[0].text);
  } catch { reply('Sorry, please try again. / معذرت، دوبارہ کوشش کریں۔'); }
});

// ─────────────────────────────────────────────
// LAWYER REGISTRATION
// ─────────────────────────────────────────────

// Step 1: Submit registration form → send OTP to email
app.post('/api/register', async (req, res) => {
  const {
    fullName, cnic, licenseNumber, barCouncil, specializations,
    city, court, experience, phone, email, languages, about
  } = req.body;

  // Validate required fields
  const required = { fullName, cnic, licenseNumber, barCouncil, city, phone, email };
  for (const [key, val] of Object.entries(required)) {
    if (!val || !String(val).trim()) {
      return res.status(400).json({ error: `${key} is required` });
    }
  }

  // Validate CNIC (13 digits)
  if (!/^\d{13}$/.test(cnic.replace(/-/g, ''))) {
    return res.status(400).json({ error: 'CNIC must be 13 digits' });
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Validate phone (Pakistani format)
  if (!/^(\+92|0)?[0-9]{10,11}$/.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const data = loadData();

  // Check duplicate license or email
  const duplicate = data.registrations.find(r =>
    r.licenseNumber === licenseNumber || r.email === email.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ error: 'A registration with this license number or email already exists.' });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const registrationId = uuidv4();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Store pending registration + OTP
  data.otps[registrationId] = {
    otp,
    expiresAt,
    registrationData: {
      id: registrationId,
      fullName: fullName.trim(),
      cnic: cnic.replace(/-/g, ''),
      licenseNumber: licenseNumber.trim(),
      barCouncil,
      specializations: Array.isArray(specializations) ? specializations : [specializations].filter(Boolean),
      city,
      court: court?.trim() || '',
      experience: parseInt(experience) || 0,
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      languages: Array.isArray(languages) ? languages : [languages].filter(Boolean),
      about: about?.trim() || '',
      status: 'pending',
      emailVerified: false,
      submittedAt: new Date().toISOString()
    }
  };
  saveData(data);

  // Send OTP email
  await sendEmail(email, 'MRA — Verify Your Email (OTP)', `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#166534;">MRA — My Rights App</h2>
      <p>Dear <strong>${fullName}</strong>,</p>
      <p>Thank you for registering as a lawyer on MRA. Please verify your email using the OTP below:</p>
      <div style="background:#dcfce7;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
        <div style="font-size:36px;font-weight:bold;color:#166534;letter-spacing:8px;">${otp}</div>
        <p style="color:#4b5563;font-size:13px;">This OTP expires in 15 minutes</p>
      </div>
      <p style="color:#4b5563;font-size:13px;">If you did not register on MRA, ignore this email.</p>
      <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
    </div>
  `);

  res.json({ success: true, registrationId, message: 'OTP sent to your email. Please check your inbox.' });
});

// Step 2: Verify OTP
app.post('/api/register/verify', async (req, res) => {
  const { registrationId, otp } = req.body;
  if (!registrationId || !otp) return res.status(400).json({ error: 'Registration ID and OTP required' });

  const data = loadData();
  const pending = data.otps[registrationId];

  if (!pending) return res.status(404).json({ error: 'Registration not found. Please submit again.' });
  if (Date.now() > pending.expiresAt) {
    delete data.otps[registrationId];
    saveData(data);
    return res.status(410).json({ error: 'OTP expired. Please register again.' });
  }
  if (pending.otp !== otp.trim()) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });

  // Mark email verified, save registration
  const registration = { ...pending.registrationData, emailVerified: true };
  data.registrations.push(registration);
  delete data.otps[registrationId];
  saveData(data);

  // Notify admin
  await sendEmail(
    process.env.EMAIL_USER || process.env.ADMIN_EMAIL || '',
    `MRA — New Lawyer Registration: ${registration.fullName}`,
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#166534;">New Lawyer Registration — Pending Approval</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${Object.entries({
          'Full Name': registration.fullName,
          'CNIC': registration.cnic,
          'License Number': registration.licenseNumber,
          'Bar Council': registration.barCouncil,
          'City': registration.city,
          'Court': registration.court,
          'Experience': registration.experience + ' years',
          'Phone': registration.phone,
          'Email': registration.email,
          'Specializations': registration.specializations.join(', '),
          'Languages': registration.languages.join(', '),
          'About': registration.about,
        }).map(([k,v]) => `<tr><td style="padding:8px;background:#f9fafb;font-weight:bold;border:1px solid #e5e7eb;width:35%">${k}</td><td style="padding:8px;border:1px solid #e5e7eb;">${v||'-'}</td></tr>`).join('')}
      </table>
      <div style="margin-top:20px;">
        <a href="${process.env.APP_URL || 'https://mra-production-56be.up.railway.app'}/admin?key=${process.env.ADMIN_PASSWORD || 'admin123'}"
           style="background:#166534;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Review in Admin Panel
        </a>
      </div>
    </div>
    `
  );

  // Confirmation to lawyer
  await sendEmail(registration.email, 'MRA — Registration Received', `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <h2 style="color:#166534;">MRA — My Rights App</h2>
      <p>Dear <strong>${registration.fullName}</strong>,</p>
      <p>Your registration has been received and your email has been verified. ✅</p>
      <p>Our team will review your credentials within <strong>2-3 business days</strong>. You will receive an email once your profile is approved and live on MRA.</p>
      <p style="color:#4b5563;font-size:13px;">Registration ID: <code>${registration.id}</code></p>
      <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
    </div>
  `);

  res.json({ success: true, message: 'Email verified! Your registration is under review. You will be notified within 2-3 business days.' });
});

// ─────────────────────────────────────────────
// PUBLIC LAWYER DIRECTORY
// ─────────────────────────────────────────────
app.get('/api/lawyers', (req, res) => {
  const data = loadData();
  const approved = data.registrations
    .filter(r => r.status === 'approved')
    .map(r => ({
      name: 'Adv. ' + r.fullName,
      city: r.city,
      spec: r.specializations[0] || 'General',
      exp: r.experience + ' years',
      court: r.court,
      phone: r.phone,
      avatar: r.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      verified: true
    }));
  res.json({ lawyers: approved });
});

// ─────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────
app.get('/admin', (req, res) => {
  const key = req.query.key;
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';
  if (key !== adminPassword) {
    return res.send(`
      <html><body style="font-family:Arial;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
        <div style="background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);width:320px;">
          <h2 style="color:#166534;margin:0 0 20px;">MRA Admin</h2>
          <form method="get">
            <input name="key" type="password" placeholder="Admin password"
              style="width:100%;padding:10px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;margin-bottom:10px;"/>
            <button type="submit" style="width:100%;background:#166534;color:white;border:none;padding:10px;border-radius:8px;font-size:14px;cursor:pointer;">Login</button>
          </form>
        </div>
      </body></html>
    `);
  }

  const data = loadData();
  const regs = data.registrations;

  const pending = regs.filter(r => r.status === 'pending');
  const approved = regs.filter(r => r.status === 'approved');
  const rejected = regs.filter(r => r.status === 'rejected');

  function regCard(r, showActions = false) {
    return `
      <div style="background:white;border:1.5px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div style="width:44px;height:44px;border-radius:50%;background:#dcfce7;color:#166534;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;flex-shrink:0;">
            ${r.fullName.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:bold;color:#1f2937;">${r.fullName}</div>
            <div style="font-size:12px;color:#6b7280;">${r.city} | ${r.barCouncil} | License: ${r.licenseNumber}</div>
          </div>
          <span style="margin-left:auto;background:${r.status==='approved'?'#dcfce7':r.status==='rejected'?'#fee2e2':'#fef9c3'};color:${r.status==='approved'?'#166534':r.status==='rejected'?'#dc2626':'#92400e'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">${r.status.toUpperCase()}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:#6b7280;margin-bottom:10px;">
          <div>📞 ${r.phone}</div>
          <div>✉️ ${r.email} ${r.emailVerified?'✅':''}</div>
          <div>⚖️ ${r.court || '-'}</div>
          <div>🕐 ${r.experience} years</div>
          <div>🔖 ${(r.specializations||[]).join(', ')}</div>
          <div>🆔 CNIC: ${r.cnic}</div>
        </div>
        ${r.about ? `<div style="font-size:12px;color:#4b5563;margin-bottom:10px;">${r.about}</div>` : ''}
        ${showActions ? `
          <div style="display:flex;gap:8px;">
            <form method="post" action="/admin/approve/${r.id}?key=${key}" style="flex:1;">
              <button type="submit" style="width:100%;background:#166534;color:white;border:none;padding:8px;border-radius:7px;cursor:pointer;font-weight:bold;">✓ Approve</button>
            </form>
            <form method="post" action="/admin/reject/${r.id}?key=${key}" style="flex:1;">
              <button type="submit" style="width:100%;background:#dc2626;color:white;border:none;padding:8px;border-radius:7px;cursor:pointer;font-weight:bold;">✗ Reject</button>
            </form>
          </div>
        ` : ''}
        <div style="font-size:11px;color:#9ca3af;margin-top:8px;">Submitted: ${new Date(r.submittedAt).toLocaleString('en-PK')}</div>
      </div>
    `;
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>MRA Admin Panel</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f9fafb; }
        .header { background: linear-gradient(135deg,#14532d,#166534); color: white; padding: 16px 20px; }
        .header h1 { font-size: 18px; }
        .header p { font-size: 12px; opacity: 0.7; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
        .stat { background: white; border-radius: 10px; padding: 16px; text-align: center; border: 1.5px solid #e5e7eb; }
        .stat .num { font-size: 28px; font-weight: bold; }
        .stat .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .section-title { font-size: 15px; font-weight: bold; color: #1f2937; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
        .empty { text-align: center; color: #9ca3af; padding: 30px; background: white; border-radius: 10px; border: 1.5px solid #e5e7eb; }
        .logout { float:right; color:rgba(255,255,255,0.7); text-decoration:none; font-size:13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <a href="/admin" class="logout">Logout</a>
        <h1>⚖️ MRA Admin Panel</h1>
        <p>My Rights App — Lawyer Registration Management</p>
      </div>
      <div class="container">
        <div class="stats">
          <div class="stat"><div class="num" style="color:#f59e0b;">${pending.length}</div><div class="label">Pending Review</div></div>
          <div class="stat"><div class="num" style="color:#166534;">${approved.length}</div><div class="label">Approved & Live</div></div>
          <div class="stat"><div class="num" style="color:#dc2626;">${rejected.length}</div><div class="label">Rejected</div></div>
        </div>

        <div class="section-title">🕐 Pending Review (${pending.length})</div>
        ${pending.length ? pending.map(r => regCard(r, true)).join('') : '<div class="empty">No pending registrations</div>'}

        <div class="section-title" style="margin-top:24px;">✅ Approved (${approved.length})</div>
        ${approved.length ? approved.map(r => regCard(r, false)).join('') : '<div class="empty">No approved lawyers yet</div>'}

        <div class="section-title" style="margin-top:24px;">✗ Rejected (${rejected.length})</div>
        ${rejected.length ? rejected.map(r => regCard(r, false)).join('') : '<div class="empty">No rejected registrations</div>'}
      </div>
    </body>
    </html>
  `);
});

app.post('/admin/approve/:id', (req, res) => {
  const key = req.query.key;
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';
  if (key !== adminPassword) return res.status(403).send('Unauthorized');

  const data = loadData();
  const reg = data.registrations.find(r => r.id === req.params.id);
  if (reg) {
    reg.status = 'approved';
    reg.approvedAt = new Date().toISOString();
    saveData(data);
    sendEmail(reg.email, 'MRA — Your Profile is Now Live! 🎉', `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#166534;">Congratulations! You are now live on MRA</h2>
        <p>Dear <strong>${reg.fullName}</strong>,</p>
        <p>Your lawyer profile has been approved and is now visible to thousands of citizens using MRA — My Rights App.</p>
        <p>Citizens can find you at: <strong>${reg.city}</strong> | <strong>${(reg.specializations||[]).join(', ')}</strong></p>
        <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
      </div>
    `);
  }
  res.redirect(`/admin?key=${key}`);
});

app.post('/admin/reject/:id', (req, res) => {
  const key = req.query.key;
  const adminPassword = process.env.ADMIN_PASSWORD || 'mra-admin-2024';
  if (key !== adminPassword) return res.status(403).send('Unauthorized');

  const data = loadData();
  const reg = data.registrations.find(r => r.id === req.params.id);
  if (reg) {
    reg.status = 'rejected';
    reg.rejectedAt = new Date().toISOString();
    saveData(data);
    sendEmail(reg.email, 'MRA — Registration Update', `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#dc2626;">Registration Not Approved</h2>
        <p>Dear <strong>${reg.fullName}</strong>,</p>
        <p>Unfortunately we were unable to verify your credentials at this time. If you believe this is an error, please contact us with your Bar Council documentation.</p>
        <p style="color:#166534;font-weight:bold;">MRA — میرے حقوق ایپ</p>
      </div>
    `);
  }
  res.redirect(`/admin?key=${key}`);
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  const data = loadData();
  res.json({
    status: 'ok',
    service: 'MRA - My Rights App',
    ai: !!process.env.ANTHROPIC_API_KEY,
    email: !!process.env.EMAIL_USER,
    whatsapp: !!process.env.TWILIO_ACCOUNT_SID,
    registrations: data.registrations.length,
    pending: data.registrations.filter(r => r.status === 'pending').length,
    approved: data.registrations.filter(r => r.status === 'approved').length,
  });
});

app.get('*', (req, res) => {
  const inPublic = path.join(__dirname, 'public', 'index.html');
  const inRoot   = path.join(__dirname, 'index.html');
  if (fs.existsSync(inPublic)) return res.sendFile(inPublic);
  if (fs.existsSync(inRoot))   return res.sendFile(inRoot);
  res.status(404).send('MRA: index.html not found. Please upload it to GitHub.');
});

app.listen(PORT, () => {
  console.log(`✅ MRA running on http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin`);
});
