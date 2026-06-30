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

    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'api/legal-aid/suggestions:POST',message:'supabase legal_aid query',data:{error:error?.message??null,rowCount:data?.length??0,questionPreview:question.slice(0,80),sectionCount:sections.length},timestamp:Date.now(),hypothesisId:'A',runId:'part2'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'api/legal-aid/suggestions:result',message:'suggestions picked',data:{tags,matchedCount:matched.length,matchedNames:matched.map(m=>m.name),helplineName:helpline?.name??null},timestamp:Date.now(),hypothesisId:'B',runId:'part2'})}).catch(()=>{});
    // #endregion

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
