import type { LawSection } from './types';

export const HELPS_WITH_TAGS = [
  'criminal',
  'family',
  'women',
  'labour',
  'property',
  'consumer',
] as const;

export type HelpsWithTag = (typeof HELPS_WITH_TAGS)[number];

/** Keyword groups for inferring helps_with tags from question + law sections. */
const TAG_KEYWORDS: Record<HelpsWithTag, string[]> = {
  criminal: [
    'fir',
    'first information report',
    'police',
    'arrest',
    'bail',
    'criminal',
    'penal code',
    'ppc',
    'theft',
    'murder',
    'robbery',
    'detention',
    'remand',
    'prosecution',
    '489-f',
    'cheque bounce',
    'dishonour',
    'dishonor',
    'investigation',
    'register my fir',
    'register an fir',
    'register fir',
    'wont register',
    "won't register",
  ],
  family: [
    'divorce',
    'khula',
    'custody',
    'marriage',
    'nikah',
    'inheritance',
    'family',
    'maintenance',
    'nafqa',
    'dower',
    'meher',
    'guardianship',
    'child custody',
  ],
  women: [
    'domestic violence',
    'harassment',
    'dowry',
    'gender discrimination',
    'wife abuse',
    'husband abuse',
    'violence against women',
    'women lawyer',
  ],
  labour: [
    'salary',
    'wage',
    'wages',
    'employer',
    'employment',
    'labour',
    'labor',
    'worker',
    'terminated',
    'fired',
    'unpaid',
    'factory',
    'industrial relations',
  ],
  property: [
    'landlord',
    'tenant',
    'eviction',
    'rent',
    'lease',
    'property dispute',
    'land dispute',
    'housing',
    'evict',
  ],
  consumer: [
    'consumer',
    'defective',
    'refund',
    'warranty',
    'faulty product',
    'service provider',
    'utility bill',
  ],
};

const LAW_NAME_BOOSTS: { pattern: RegExp; tag: HelpsWithTag; weight: number }[] = [
  { pattern: /penal code|ppc|cr\.?\s*p\.?\s*c/i, tag: 'criminal', weight: 4 },
  { pattern: /family|dissolution|marriage|guardian/i, tag: 'family', weight: 4 },
  { pattern: /industrial|labour|labor|employment/i, tag: 'labour', weight: 4 },
  { pattern: /rent|tenancy|eviction|transfer of property/i, tag: 'property', weight: 4 },
  { pattern: /consumer|competition/i, tag: 'consumer', weight: 4 },
];

const SECTION_REF_BOOSTS: { pattern: RegExp; tag: HelpsWithTag; weight: number }[] = [
  { pattern: /^section\s*154|^\s*154\b/i, tag: 'criminal', weight: 3 },
  { pattern: /489-?f/i, tag: 'criminal', weight: 3 },
  { pattern: /498-?a|497|376|375/i, tag: 'women', weight: 3 },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function countKeywordHits(text: string, keywords: string[]): number {
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) hits += 1;
  }
  return hits;
}

type SectionSlice = Pick<LawSection, 'lawName' | 'sectionRef' | 'heading' | 'body'>;

function lawBoostScores(sections: SectionSlice[]): Map<HelpsWithTag, number> {
  const boosts = new Map<HelpsWithTag, number>();
  for (const section of sections) {
    const blob = `${section.lawName} ${section.sectionRef} ${section.heading}`;
    for (const { pattern, tag, weight } of LAW_NAME_BOOSTS) {
      if (pattern.test(section.lawName) || pattern.test(blob)) {
        boosts.set(tag, (boosts.get(tag) ?? 0) + weight);
      }
    }
    for (const { pattern, tag, weight } of SECTION_REF_BOOSTS) {
      if (pattern.test(section.sectionRef) || pattern.test(section.heading)) {
        boosts.set(tag, (boosts.get(tag) ?? 0) + weight);
      }
    }
  }
  return boosts;
}

/**
 * Score helps_with tags from the user's question and matched law sections.
 * Section body text alone cannot trigger a tag — the question or law metadata must support it.
 */
export function inferHelpsWithTags(question: string, sections: SectionSlice[]): HelpsWithTag[] {
  const questionText = normalize(question);
  const questionScores = new Map<HelpsWithTag, number>();
  for (const tag of HELPS_WITH_TAGS) {
    const qHits = countKeywordHits(questionText, TAG_KEYWORDS[tag]);
    if (qHits > 0) questionScores.set(tag, qHits * 3);
  }

  const boosts = lawBoostScores(sections);
  const combined = new Map<HelpsWithTag, number>();

  for (const tag of HELPS_WITH_TAGS) {
    const qScore = questionScores.get(tag) ?? 0;
    const boost = boosts.get(tag) ?? 0;
    if (qScore > 0 || boost >= 3) {
      combined.set(tag, qScore + boost);
    }
  }

  const ranked = HELPS_WITH_TAGS.filter((tag) => (combined.get(tag) ?? 0) >= 3).sort(
    (a, b) => (combined.get(b) ?? 0) - (combined.get(a) ?? 0),
  );

  return ranked.slice(0, 2);
}

export const NATIONAL_HELPLINE_PHONE = '0800-46723';

export function isHelplineEntry(item: { orgType: string; phone: string | null; name: string }): boolean {
  if (item.orgType === 'helpline') return true;
  if (item.phone?.replace(/\s/g, '') === NATIONAL_HELPLINE_PHONE.replace(/\s/g, '')) return true;
  return /free legal help helpline/i.test(item.name);
}
