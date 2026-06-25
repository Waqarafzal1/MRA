import { getAnthropic, AI_MODEL, SYSTEM_PROMPT } from '@/lib/ai';
import { supabaseServer } from '@/lib/supabase';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { message, lang, phone } = await request.json();

  if (!message?.trim()) {
    return Response.json({ error: 'Message required' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const langHint =
      lang === 'ur' ? 'Respond in Urdu (Nastaliq script).' : 'Respond in English.';
    const aiResponse = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${langHint}\n\nQuestion: ${message}` }],
    });
    const text =
      aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

    // Persist the Q&A if the client supplied a phone number
    if (typeof phone === 'string' && phone.trim()) {
      const normalizedPhone = normalizePhone(phone);
      console.log('[ask-simple] persisting for phone:', normalizedPhone, '(raw:', phone.trim(), ')');
      const { data: inserted, error } = await supabaseServer()
        .from('chat_history')
        .insert({
          phone: normalizedPhone,
          question: message,
          response: text,
          lang: lang === 'ur' ? 'ur' : 'en',
        })
        .select('id, phone');
      if (error) {
        console.error('[ask-simple] insert FAILED:', error.code, error.message, error.details);
      } else {
        console.log('[ask-simple] insert OK — row id:', inserted?.[0]?.id, 'phone:', inserted?.[0]?.phone);
      }
    }

    return Response.json({ response: text });
  } catch {
    return Response.json({ error: 'AI error' }, { status: 500 });
  }
}
