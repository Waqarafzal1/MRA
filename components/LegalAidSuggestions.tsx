'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LawSection, LegalAid } from '@/lib/types';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';
import { isHelplineEntry } from '@/lib/legal-aid-match';

function tagLabel(tag: string, t: Record<string, string>): string {
  const key = `legalAidTag_${tag}` as keyof typeof t;
  return (t[key] as string | undefined) ?? tag;
}

function SuggestionCard({ item, t }: { item: LegalAid; t: Record<string, string> }) {
  const helpsWith = item.helpsWith.length
    ? item.helpsWith.map((tag) => tagLabel(tag, t)).join(', ')
    : t.legalAidHelplineTopic;

  return (
    <article className="bg-white/90 border border-teal-200 rounded-lg p-3">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
        <h3 className="font-bold text-teal-950 text-sm leading-snug">{item.name}</h3>
        {item.isFree && (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-800 border border-teal-200">
            {t.legalAidFreeBadge}
          </span>
        )}
      </div>
      <p className="text-xs text-teal-900/80 leading-relaxed mb-1">
        <span className="font-semibold text-teal-900">{t.legalAidSuggestionHelpsWith}: </span>
        {helpsWith}
      </p>
      <p className="text-xs text-teal-900/80 leading-relaxed mb-2">
        <span className="font-semibold text-teal-900">{t.legalAidCoverage}: </span>
        {item.coverage}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {item.phone ? (
          <a
            href={`tel:${item.phone.replace(/\s/g, '')}`}
            className="text-teal-700 font-semibold hover:underline"
          >
            {item.phone}
          </a>
        ) : null}
        {item.website ? (
          <a
            href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 font-semibold hover:underline break-all"
          >
            {item.website.replace(/^https?:\/\//, '')}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function LegalAidSuggestions({
  question,
  sections,
  ready,
}: {
  question: string;
  sections: LawSection[];
  ready: boolean;
}) {
  const { lang, dir } = useLang();
  const t = T[lang];
  const [matched, setMatched] = useState<LegalAid[]>([]);
  const [helpline, setHelpline] = useState<LegalAid | null>(null);
  const [loading, setLoading] = useState(false);

  const sectionsKey = sections
    .map((s) => `${s.sectionRef}|${s.lawName}|${s.heading}`)
    .join(';');

  useEffect(() => {
    if (!ready || !question || sections.length === 0) {
      setMatched([]);
      setHelpline(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/legal-aid/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            sections: sections.map((s) => ({
              lawName: s.lawName,
              sectionRef: s.sectionRef,
              heading: s.heading,
              body: s.body,
            })),
          }),
        });
        const data = (await res.json()) as {
          matched?: LegalAid[];
          helpline?: LegalAid | null;
        };
        if (cancelled) return;

        const nextMatched = data.matched ?? [];
        const nextHelpline = data.helpline ?? null;
        setMatched(nextMatched);
        setHelpline(nextHelpline);

        // #region agent log
        fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'LegalAidSuggestions.tsx:load',message:'client suggestions loaded',data:{matchedCount:nextMatched.length,hasHelpline:!!nextHelpline,questionPreview:question.slice(0,60)},timestamp:Date.now(),hypothesisId:'C',runId:'part2'})}).catch(()=>{});
        // #endregion
      } catch {
        if (!cancelled) {
          setMatched([]);
          setHelpline(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ready, question, sections, sectionsKey]);

  if (!ready || loading) return null;

  const helplineInMatched = helpline && matched.some((m) => m.id === helpline.id);
  const showHelpline = helpline && !helplineInMatched;
  const cards = [...matched, ...(showHelpline ? [helpline] : [])];

  if (cards.length === 0) return null;

  const showHelplineNote = showHelpline && isHelplineEntry(helpline);

  return (
    <section
      className="bg-teal-50 border-2 border-teal-300 rounded-xl p-4"
      dir={dir}
      aria-labelledby="legal-aid-suggestions-heading"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg flex-shrink-0" aria-hidden="true">
          🤝
        </span>
        <h2
          id="legal-aid-suggestions-heading"
          className="text-[11px] font-bold text-teal-900 uppercase tracking-wider"
        >
          {t.legalAidSuggestionTitle}
        </h2>
      </div>

      <p className="text-sm text-teal-950 leading-relaxed mb-1">{t.legalAidSuggestionIntro}</p>
      <p className="text-xs text-teal-800/90 leading-relaxed mb-3">{t.legalAidSuggestionEligibility}</p>

      <div className="flex flex-col gap-2 mb-4">
        {cards.map((item) => (
          <SuggestionCard key={item.id} item={item} t={t} />
        ))}
      </div>

      {showHelplineNote ? (
        <p className="text-[11px] text-teal-800/80 mb-3 leading-relaxed">{t.legalAidSuggestionHelplineNote}</p>
      ) : null}

      <Link
        href="/legal-aid"
        className="inline-block text-sm font-semibold text-teal-800 hover:text-teal-950 hover:underline"
      >
        {t.legalAidSeeAll} →
      </Link>
    </section>
  );
}
