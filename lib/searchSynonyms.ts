/**
 * Citizen-language → legal-term expansions and section boosts for law search.
 * Edit this file to add synonyms; no code changes needed elsewhere.
 */

export type SectionBoost = {
  lawName: string;
  sectionRef: string;
  boost: number;
};

/** Append these phrases when a token appears in the query (fed to search_law RPC). */
export const TERM_EXPANSIONS: Record<string, string[]> = {
  fir: [
    'first information report',
    'first information',
    'cognizable offence',
    'police station',
    'information in cognizable cases',
  ],
  register: ['registration', 'record', 'enter', 'writing'],
  police: ['officer incharge', 'police station', 'investigation'],
  arrest: ['custody', 'detention', 'bail'],
  cheque: ['check', 'dishonour', 'dishonor', 'bounce', 'negotiable instrument'],
  bounce: ['dishonour', 'dishonor', 'cheque', 'insufficient funds'],
  theft: ['stealing', 'stolen', 'theft', 'robbery'],
  bail: ['release', 'bond', 'surety', 'custody'],
};

/** Extra score when query matches a citizen phrasing pattern. */
export const PATTERN_BOOSTS: { pattern: RegExp; boosts: SectionBoost[] }[] = [
  {
    pattern: /\bfir\b|first information report|first information/i,
    boosts: [
      {
        lawName: 'Code of Criminal Procedure 1898',
        sectionRef: '154',
        boost: 20,
      },
    ],
  },
  {
    pattern:
      /police.{0,40}(not|won'?t|wont|refus\w*|fail\w*|den\w*).{0,40}regist|not register.{0,30}fir|refus\w*.{0,30}fir|won'?t register|wont register/i,
    boosts: [
      {
        lawName: 'Code of Criminal Procedure 1898',
        sectionRef: '154',
        boost: 18,
      },
      {
        lawName: 'Code of Criminal Procedure 1898',
        sectionRef: '22-A',
        boost: 14,
      },
    ],
  },
];

export const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'what',
  'when',
  'where',
  'who',
  'why',
  'how',
  'if',
  'i',
  'me',
  'my',
  'do',
  'does',
  'did',
  'can',
  'will',
  'would',
  'should',
  'happens',
  'happen',
  'not',
]);

export function expandSearchQuery(query: string): string {
  const lower = query.toLowerCase();
  const extra: string[] = [];

  for (const [term, phrases] of Object.entries(TERM_EXPANSIONS)) {
    const re = new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(lower)) {
      extra.push(...phrases);
    }
  }

  for (const { pattern, boosts } of PATTERN_BOOSTS) {
    if (pattern.test(query)) {
      for (const b of boosts) {
        extra.push(`section ${b.sectionRef}`);
      }
    }
  }

  if (extra.length === 0) return query;
  return `${query} ${[...new Set(extra)].join(' ')}`;
}

export function getSectionBoosts(query: string): SectionBoost[] {
  const merged = new Map<string, SectionBoost>();

  for (const { pattern, boosts } of PATTERN_BOOSTS) {
    if (!pattern.test(query)) continue;
    for (const b of boosts) {
      const key = `${b.lawName}::${b.sectionRef}`;
      const existing = merged.get(key);
      if (!existing || b.boost > existing.boost) {
        merged.set(key, b);
      }
    }
  }

  return [...merged.values()];
}

export function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ''))
    .filter((t) => t.length > 2 && !SEARCH_STOP_WORDS.has(t));
}
