import { getAnthropic, AI_MODEL, GROUNDED_ANSWER_SYSTEM_PROMPT } from '@/lib/ai';
import {
  buildGroundedAnswerUserMessage,
  generalGuidanceCitesUnknownSection,
  parseTwoLayerAnswer,
  pickSectionsForAnswer,
  stripUnknownSectionRefsFromGuidance,
} from '@/lib/grounded-answer';
import type { LawSection } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isLawSection(value: unknown): value is LawSection {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.lawName === 'string' &&
    typeof s.sectionRef === 'string' &&
    typeof s.body === 'string'
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { question, sections } = body as {
    question?: string;
    sections?: unknown;
  };

  const q = question?.trim();
  if (!q) {
    return Response.json({ error: 'question is required' }, { status: 400 });
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    return Response.json(
      { error: 'sections required — AI cannot run without DB law text' },
      { status: 400 },
    );
  }

  const validSections = sections.filter(isLawSection);
  if (validSections.length === 0) {
    return Response.json({ error: 'No valid law sections provided' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 500 });
  }

  const grounded = pickSectionsForAnswer(validSections);

  try {
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: 900,
      system: GROUNDED_ANSWER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildGroundedAnswerUserMessage(q, grounded),
        },
      ],
    });

    const raw =
      response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';

    if (!raw) {
      return Response.json({ error: 'Empty AI response' }, { status: 500 });
    }

    const layers = parseTwoLayerAnswer(raw);
    if (!layers) {
      console.error('[answer POST] Failed to parse two-layer JSON:', raw.slice(0, 200));
      return Response.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const unknownRefs = generalGuidanceCitesUnknownSection(
      layers.generalGuidance,
      grounded,
    );
    if (unknownRefs.length > 0) {
      console.warn('[answer POST] General guidance cited unknown sections:', unknownRefs);
    }

    const generalGuidance = stripUnknownSectionRefsFromGuidance(
      layers.generalGuidance,
      grounded,
    );

    return Response.json({
      question: q,
      verifiedLaw: layers.verifiedLaw,
      generalGuidance,
      groundedSectionRefs: grounded.map((s) => s.sectionRef),
    });
  } catch (err) {
    console.error('[answer POST]', err);
    return Response.json({ error: 'AI request failed' }, { status: 500 });
  }
}
