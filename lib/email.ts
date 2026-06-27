import { Resend } from 'resend';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is not set — skipping send to', to);
    return false;
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: 'My Rights App <noreply@my-rights-app.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[email] Resend error sending to', to, '—', error.message);
      return false;
    }

    console.log('[email] Sent to', to, '| id:', data?.id);
    return true;
  } catch (e) {
    console.error('[email] Unexpected error sending to', to, '—', (e as Error).message);
    return false;
  }
}
