import nodemailer from 'nodemailer';

function getMailer() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const mailer = getMailer();
  if (!mailer) {
    console.log('Email not configured — skipping send to', to);
    return;
  }
  try {
    await mailer.sendMail({
      from: `"MRA My Rights App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent to', to);
  } catch (e) {
    console.error('Email error:', (e as Error).message);
  }
}
