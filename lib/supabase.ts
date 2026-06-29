import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LawSection, Registration } from './types';

let _client: SupabaseClient | null = null;

// Server-only. Never import this from client components.
// SUPABASE_SERVICE_ROLE_KEY is intentionally not prefixed with NEXT_PUBLIC_
// so Next.js never includes it in the browser bundle.
export function supabaseServer(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Converts a snake_case DB row from the registrations table to the Registration TS type.
export function rowToRegistration(row: Record<string, unknown>): Registration {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    cnic: row.cnic as string,
    licenseNumber: row.license_number as string,
    barCouncil: row.bar_council as string,
    specializations: (row.specializations as string[]) ?? [],
    city: row.city as string,
    court: (row.court as string) ?? '',
    experience: (row.experience as number) ?? 0,
    phone: row.phone as string,
    email: row.email as string,
    languages: (row.languages as string[]) ?? [],
    about: (row.about as string) ?? '',
    status: row.status as Registration['status'],
    emailVerified: (row.email_verified as boolean) ?? false,
    submittedAt: row.submitted_at as string,
    approvedAt: (row.approved_at as string | null) ?? undefined,
    rejectedAt: (row.rejected_at as string | null) ?? undefined,
  };
}

export function rowToLawSection(row: Record<string, unknown>): LawSection {
  return {
    id: row.id as string,
    lawName: row.law_name as string,
    sectionRef: row.section_ref as string,
    heading: (row.heading as string) ?? '',
    body: row.body as string,
    source: (row.source as string) ?? '',
    sourceUrl: (row.source_url as string) ?? '',
    amendedUpTo: (row.amended_up_to as string) ?? '',
  };
}
