'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import FreeQuestionsCounter from '@/components/FreeQuestionsCounter';
import { useAuth } from '@/lib/auth-context';
import type { LawSection } from '@/lib/types';
import { pickSectionsForAnswer, type TwoLayerAnswer } from '@/lib/grounded-answer';
import {
  getQuestionCount,
  incrementQuestionCount,
  isQuestionLimitReached,
} from '@/lib/question-gate';
import { T, gateMessage } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

function SectionCard({ section }: { section: LawSection }) {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <article className="bg-white border-2 border-stone-200 rounded-xl p-4">
      <h2 className="font-bold text-stone-800 text-sm mb-2">
        {section.sectionRef}
        {section.heading ? ` — ${section.heading}` : ''}
      </h2>
      <p className="text-stone-600 text-xs leading-relaxed whitespace-pre-wrap mb-3">
        {section.body}
      </p>
      <p className="text-[11px] text-stone-500 border-t border-stone-100 pt-2">
        {section.lawName}
        {section.amendedUpTo ? (
          <>
            {' '}
            · {t.amendedUpTo} {section.amendedUpTo}
          </>
        ) : null}
        {section.source ? <> · {section.source}</> : null}
      </p>
    </article>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';
  const { lang, dir } = useLang();
  const t = T[lang];
  const { userEmail, openSignIn } = useAuth();
  const signedIn = !!userEmail;
  const [results, setResults] = useState<LawSection[]>([]);
  const [answer, setAnswer] = useState<TwoLayerAnswer | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [aiGated, setAiGated] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      setAnswer(null);
      setError(null);
      setAnswerError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoadingSearch(true);
      setLoadingAnswer(false);
      setError(null);
      setAnswerError(null);
      setAnswer(null);
      setResults([]);
      setAiGated(false);

      try {
        const searchRes = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const searchData = (await searchRes.json()) as {
          results?: LawSection[];
          error?: string;
          detail?: string;
        };
        if (!searchRes.ok) {
          throw new Error(searchData.detail ?? searchData.error ?? t.searchFailed);
        }

        const sections = searchData.results ?? [];
        if (cancelled) return;

        setResults(sections);
        setLoadingSearch(false);

        if (sections.length === 0) return;

        if (!signedIn && isQuestionLimitReached(getQuestionCount())) {
          setAiGated(true);
          openSignIn('citizen', gateMessage(lang));
          return;
        }

        setLoadingAnswer(true);
        const grounded = pickSectionsForAnswer(sections);
        const answerRes = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, sections: grounded }),
        });
        const answerData = (await answerRes.json()) as {
          verifiedLaw?: string;
          generalGuidance?: string;
          error?: string;
        };

        if (cancelled) return;

        if (!answerRes.ok) {
          setAnswerError(answerData.error ?? t.couldNotExplain);
        } else if (answerData.verifiedLaw && answerData.generalGuidance) {
          setAnswer({
            verifiedLaw: answerData.verifiedLaw,
            generalGuidance: answerData.generalGuidance,
          });
          if (!signedIn) {
            incrementQuestionCount();
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setResults([]);
          setError(err instanceof Error ? err.message : t.searchFailed);
        }
      } finally {
        if (!cancelled) {
          setLoadingSearch(false);
          setLoadingAnswer(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q, signedIn, openSignIn, lang, t.searchFailed, t.couldNotExplain]);

  if (!q) {
    return (
      <p className="text-stone-500 text-sm text-center py-8" dir={dir}>
        {t.enterSearchTerm}
      </p>
    );
  }

  if (loadingSearch) {
    return (
      <p className="text-stone-500 text-sm text-center py-8" dir={dir}>
        {t.searchingLaw}
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600 text-sm text-center py-8" dir={dir}>
        {error}
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-stone-600 text-sm text-center py-8 leading-relaxed" dir={dir}>
        {t.noLawFound}
      </p>
    );
  }

  const displayedSections = pickSectionsForAnswer(results);

  return (
    <div className="flex flex-col gap-4 pb-8" dir={dir}>
      {/* Layer 1 — verified database law (green) */}
      <section className="bg-brand/5 border-2 border-brand/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/15 text-brand flex items-center justify-center text-sm font-bold"
            aria-hidden="true"
          >
            ✓
          </span>
          <p className="text-[11px] font-bold text-brand uppercase tracking-wider">
            {t.verifiedLawTitle}
          </p>
        </div>

        {loadingAnswer ? (
          <p className="text-stone-600 text-sm mb-4">{t.preparingExplanation}</p>
        ) : aiGated ? (
          <p className="text-stone-600 text-sm leading-relaxed mb-4">
            {gateMessage(lang)} {t.gateLawFree}
          </p>
        ) : answerError ? (
          <p className="text-stone-600 text-sm mb-4">{answerError}</p>
        ) : answer ? (
          <p className="text-stone-800 text-sm leading-relaxed whitespace-pre-wrap mb-4">
            {answer.verifiedLaw}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {displayedSections.map((section, i) => (
            <SectionCard key={`${section.sectionRef}-${i}`} section={section} />
          ))}
        </div>
      </section>

      {/* Layer 2 — general AI guidance (amber) */}
      {!aiGated && !answerError && (loadingAnswer || answer) && (
        <section className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg flex-shrink-0" aria-hidden="true">
              💡
            </span>
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              {t.generalGuidanceTitle}
            </p>
          </div>
          {loadingAnswer ? (
            <p className="text-amber-900/80 text-sm">{t.preparingExplanation}</p>
          ) : answer ? (
            <p className="text-amber-950 text-sm leading-relaxed whitespace-pre-wrap">
              {answer.generalGuidance}
            </p>
          ) : null}
        </section>
      )}

      {/* AI reasoning footer — always when answer layers shown or loading */}
      {!aiGated && !answerError && (loadingAnswer || answer) && (
        <p className="text-[11px] text-stone-500 text-center leading-relaxed px-2">
          {t.aiReasoningFooter}
        </p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
        {t.searchDisclaimer}
      </div>

      <Link
        href="/?tab=lawyers"
        className="block text-center bg-brand text-white text-sm font-semibold py-3 rounded-xl hover:bg-brand/90 transition-colors"
      >
        {t.findLawyer}
      </Link>
    </div>
  );
}

export default function SearchPage() {
  const { lang, dir } = useLang();
  const t = T[lang];

  return (
    <>
      <Header />
      <main className="max-w-[760px] mx-auto px-3.5 py-4" dir={dir}>
        <Link
          href="/"
          className="inline-block text-brand text-sm font-semibold mb-2 hover:underline"
        >
          {t.back}
        </Link>
        <FreeQuestionsCounter />
        <Suspense fallback={<p className="text-stone-500 text-sm">{t.loading}</p>}>
          <SearchResults />
        </Suspense>
      </main>
    </>
  );
}
