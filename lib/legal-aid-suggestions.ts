import type { LegalAid } from './types';
import { inferHelpsWithTags, isHelplineEntry, type HelpsWithTag } from './legal-aid-match';

export function pickLegalAidSuggestions(
  allItems: LegalAid[],
  question: string,
  sections: Parameters<typeof inferHelpsWithTags>[1],
  maxMatches = 3,
): { matched: LegalAid[]; helpline: LegalAid | null; tags: HelpsWithTag[] } {
  const tags = inferHelpsWithTags(question, sections);
  const helpline = allItems.find(isHelplineEntry) ?? null;
  const primaryTag = tags[0] ?? null;

  const nonHelpline = allItems.filter((item) => !isHelplineEntry(item));

  const scored = nonHelpline
    .map((item) => {
      const overlap = tags.filter((tag) => item.helpsWith.includes(tag)).length;
      const primaryMatch = primaryTag && item.helpsWith.includes(primaryTag) ? 1 : 0;
      let relevance = primaryMatch * 10 + overlap;
      if (primaryTag === 'criminal' && item.orgType === 'government') relevance += 3;
      if (primaryTag === 'criminal' && item.orgType === 'bar_committee') relevance += 2;
      if (item.coverage === 'national') relevance += 1;
      return { item, overlap, primaryMatch, relevance };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        a.item.name.localeCompare(b.item.name),
    );

  const matched = scored.slice(0, maxMatches).map(({ item }) => item);

  return { matched, helpline, tags };
}

/** Minimal safe fallback when Supabase is unreachable — helpline only. */
export function helplineOnlyFallback(): LegalAid {
  return {
    id: 'fallback-helpline',
    name: 'Free Legal Help Helpline',
    orgType: 'helpline',
    helpsWith: [],
    whoQualifies: '',
    coverage: 'national',
    phone: '0800-46723',
    address: null,
    website: null,
    isFree: true,
    isVerified: false,
    sourceUrl: 'https://www.ljcp.gov.pk',
    lastVerified: null,
  };
}
