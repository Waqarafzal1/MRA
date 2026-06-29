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
