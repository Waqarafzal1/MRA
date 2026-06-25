import { getAnthropic, AI_MODEL, SYSTEM_PROMPT } from '@/lib/ai';

export const runtime = 'nodejs';

function twiml(text: string): Response {
  const safe = text.length > 1550 ? text.substring(0, 1550) + '...' : text;
  const escaped = safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${escaped}</Body></Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } },
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const msg = ((formData.get('Body') as string) || '').trim();

  if (!msg) {
    return twiml(
      'Welcome to MRA — My Rights App. Type your legal question in Urdu or English.\n\nMRA میں خوش آمدید۔ اپنا قانونی سوال لکھیں۔',
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return twiml('Service temporarily unavailable.');
  }

  try {
    const hasUrdu = /[؀-ۿ]/.test(msg);
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${hasUrdu ? 'Respond in Urdu.' : 'Respond in English.'}\n\nQuestion: ${msg}`,
        },
      ],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return twiml(text);
  } catch {
    return twiml('Sorry, please try again. / معذرت، دوبارہ کوشش کریں۔');
  }
}
