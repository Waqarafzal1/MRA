import { getAnthropic, AI_MODEL, SYSTEM_PROMPT } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { message, language } = await request.json();

  if (!message?.trim()) {
    return Response.json({ error: 'Message required' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 500 });
  }

  const langHint =
    language === 'ur'
      ? 'User selected Urdu. Respond in Urdu (Nastaliq script).'
      : 'User selected English. Respond in English.';

  const enc = new TextEncoder();
  const send = (data: object) => enc.encode(`data: ${JSON.stringify(data)}\n\n`);

  const readable = new ReadableStream({
    start(controller) {
      try {
        const stream = getAnthropic().messages.stream({
          model: AI_MODEL,
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `${langHint}\n\nQuestion: ${message}` }],
        });

        stream.on('text', (text: string) => controller.enqueue(send({ text })));
        stream.on('message', () => {
          controller.enqueue(send({ done: true }));
          controller.close();
        });
        stream.on('error', () => {
          controller.enqueue(send({ error: 'AI error' }));
          controller.close();
        });
      } catch {
        controller.enqueue(send({ error: 'Connection failed' }));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
