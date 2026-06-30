import type { LawSection } from './types';

const MAX_SECTIONS_FOR_AI = 3;
const MAX_BODY_CHARS = 4000;

export function pickSectionsForAnswer(sections: LawSection[]): LawSection[] {
  return sections.slice(0, MAX_SECTIONS_FOR_AI);
}

export function formatSectionsForPrompt(sections: LawSection[]): string {
  return sections
    .map((s, i) => {
      const body =
        s.body.length > MAX_BODY_CHARS
          ? `${s.body.slice(0, MAX_BODY_CHARS)}…`
          : s.body;
      return [
        `--- Section ${i + 1} ---`,
        `law_name: ${s.lawName}`,
        `section_ref: ${s.sectionRef}`,
        `heading: ${s.heading}`,
        `body:`,
        body,
      ].join('\n');
    })
    .join('\n\n');
}

export function buildGroundedAnswerUserMessage(
  question: string,
  sections: LawSection[],
): string {
  return `User question:\n${question.trim()}\n\nLaw sections (ONLY source you may use):\n\n${formatSectionsForPrompt(sections)}`;
}

/** Section refs the AI is allowed to mention — for post-checks in tests. */
export function allowedSectionRefs(sections: LawSection[]): Set<string> {
  return new Set(
    sections.map((s) => s.sectionRef.trim()).filter(Boolean),
  );
}

export interface TwoLayerAnswer {
  verifiedLaw: string;
  generalGuidance: string;
}

const SECTION_REF_IN_TEXT =
  /\b(?:Section|Article|Art\.?)\s*[\d]+[A-Za-z-]*\b/gi;

export function parseTwoLayerAnswer(raw: string): TwoLayerAnswer | null {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) text = fence[1].trim();

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (
      typeof parsed.verifiedLaw === 'string' &&
      typeof parsed.generalGuidance === 'string' &&
      parsed.verifiedLaw.trim() &&
      parsed.generalGuidance.trim()
    ) {
      return {
        verifiedLaw: parsed.verifiedLaw.trim(),
        generalGuidance: parsed.generalGuidance.trim(),
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Remove Section/Article refs in general guidance that are not in the grounded DB sections. */
export function stripUnknownSectionRefsFromGuidance(
  guidance: string,
  sections: LawSection[],
): string {
  const allowed = allowedSectionRefs(sections);
  const normalizedAllowed = new Set(
    [...allowed].map((r) => r.replace(/\s+/g, ' ').trim().toLowerCase()),
  );
  return guidance
    .replace(SECTION_REF_IN_TEXT, (match) => {
      const ref = match.replace(/\s+/g, ' ').trim().toLowerCase();
      return normalizedAllowed.has(ref) ? match : '';
    })
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;])/g, '$1')
    .trim();
}

/** List section/article refs in general guidance that are not in DB sections. */
export function generalGuidanceCitesUnknownSection(
  guidance: string,
  sections: LawSection[],
): string[] {
  const allowed = allowedSectionRefs(sections);
  const normalizedAllowed = new Set(
    [...allowed].map((r) => r.replace(/\s+/g, ' ').trim().toLowerCase()),
  );
  const unknown: string[] = [];
  for (const match of guidance.matchAll(SECTION_REF_IN_TEXT)) {
    const ref = match[0].replace(/\s+/g, ' ').trim();
    if (!normalizedAllowed.has(ref.toLowerCase())) {
      unknown.push(ref);
    }
  }
  return unknown;
}
