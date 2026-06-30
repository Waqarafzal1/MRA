import { NextRequest, NextResponse } from 'next/server';
import {
  helplineOnlyFallback,
  pickLegalAidSuggestions,
} from '@/lib/legal-aid-suggestions';
import type { LawSection } from '@/lib/types';
import { supabaseServer, rowToLegalAid } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SuggestionBody = {
  question?: string;
  sections?: Pick<LawSection, 'lawName' | 'sectionRef' | 'heading' | 'body'>[];
};

/** Match question + law sections to legal_aid rows (Supabase only). */
export async function POST(request: NextRequest) {
  let body: SuggestionBody;
  try {
    body = (await request.json()) as SuggestionBody;
  } catch {
    return NextResponse.json({ matched: [], helpline: helplineOnlyFallback(), tags: [], error: true });
  }

  const question = body.question?.trim() ?? '';
  const sections = body.sections ?? [];

  try {
    const { data, error } = await supabaseServer()
      .from('legal_aid')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data?.length) {
      console.error('[legal-aid/suggestions POST]', error?.message ?? 'no rows');
      const helpline = helplineOnlyFallback();
      return NextResponse.json({
        matched: [],
        helpline,
        tags: [],
        error: true,
      });
    }

    const allItems = data.map((r) => rowToLegalAid(r as Record<string, unknown>));
    const { matched, helpline, tags } = pickLegalAidSuggestions(allItems, question, sections);

    return NextResponse.json({
      matched,
      helpline: helpline ?? helplineOnlyFallback(),
      tags,
      error: false,
    });
  } catch (err) {
    console.error('[legal-aid/suggestions POST]', err);
    return NextResponse.json({
      matched: [],
      helpline: helplineOnlyFallback(),
      tags: [],
      error: true,
    });
  }
}
