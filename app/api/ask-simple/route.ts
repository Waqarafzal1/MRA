import { anthropic, AI_MODEL, SYSTEM_PROMPT } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { message, lang } = await request.json();

  if (!message?.trim()) {
    return Response.json({ error: 'Message required' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const langHint =
      lang === 'ur' ? 'Respond in Urdu (Nastaliq script).' : 'Respond in English.';
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${langHint}\n\nQuestion: ${message}` }],
    });
    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    return Response.json({ response: text });
  } catch {
    return Response.json({ error: 'AI error' }, { status: 500 });
  }
}
