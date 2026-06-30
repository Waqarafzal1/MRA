import seedRows from '@/data/legal-aid-seed.json';
import type { LegalAid, LegalAidOrgType } from './types';

type SeedRow = {
  name: string;
  org_type: LegalAidOrgType;
  helps_with: string[];
  who_qualifies: string;
  coverage: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_free: boolean;
  is_verified: boolean;
  source_url: string;
};

const STABLE_IDS = [
  'seed-laaja',
  'seed-helpline',
  'seed-dlec',
  'seed-pbc',
  'seed-las',
  'seed-aghs',
  'seed-pawla',
  'seed-burney',
] as const;

export function getLegalAidSeed(): LegalAid[] {
  return (seedRows as SeedRow[]).map((row, i) => ({
    id: STABLE_IDS[i] ?? `seed-${i}`,
    name: row.name,
    orgType: row.org_type,
    helpsWith: row.helps_with,
    whoQualifies: row.who_qualifies,
    coverage: row.coverage,
    phone: row.phone,
    address: row.address,
    website: row.website,
    isFree: row.is_free,
    isVerified: row.is_verified,
    sourceUrl: row.source_url,
    lastVerified: null,
  }));
}

export function filterLegalAidItems(
  items: LegalAid[],
  helpsWith: string | null,
  coverage: string | null,
): LegalAid[] {
  let out = items;
  if (helpsWith) {
    out = out.filter((item) => item.helpsWith.includes(helpsWith));
  }
  if (coverage) {
    out = out.filter((item) => item.coverage === coverage);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function isLegalAidTableMissingError(message: string): boolean {
  return (
    message.includes('Could not find the table') ||
    message.includes('does not exist') ||
    message.includes('PGRST205')
  );
}
