'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import type { LegalAid, LegalAidOrgType } from '@/lib/types';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

const HELPS_WITH_TAGS = ['criminal', 'family', 'women', 'labour', 'property', 'consumer'] as const;

const COVERAGE_OPTIONS = [
  'national',
  'district',
  'Karachi & Islamabad',
  'Lahore',
] as const;

function orgTypeLabel(orgType: LegalAidOrgType, t: Record<string, string>): string {
  const map: Record<LegalAidOrgType, string> = {
    government: t.legalAidOrgGovernment,
    bar_committee: t.legalAidOrgBar,
    ngo: t.legalAidOrgNgo,
    helpline: t.legalAidOrgHelpline,
  };
  return map[orgType] ?? orgType;
}

function tagLabel(tag: string, t: Record<string, string>): string {
  const key = `legalAidTag_${tag}` as keyof typeof t;
  return (t[key] as string | undefined) ?? tag;
}

function LegalAidCard({ item, t }: { item: LegalAid; t: Record<string, string> }) {
  return (
    <article className="bg-white border-2 border-stone-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-stone-800 text-sm leading-snug">{item.name}</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">{orgTypeLabel(item.orgType, t)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 flex-shrink-0">
          {item.isFree && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-brand/10 text-brand border border-brand/20">
              {t.legalAidFreeBadge}
            </span>
          )}
          {!item.isVerified && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
              {t.legalAidPendingVerification}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.helpsWith.map((tag) => (
          <span
            key={tag}
            className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600"
          >
            {tagLabel(tag, t)}
          </span>
        ))}
      </div>

      <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
        <p>
          <span className="font-semibold text-stone-700">{t.legalAidWhoQualifies}: </span>
          {item.whoQualifies}
        </p>
        <p>
          <span className="font-semibold text-stone-700">{t.legalAidCoverage}: </span>
          {item.coverage}
        </p>
        {item.address ? (
          <p>
            <span className="font-semibold text-stone-700">{t.legalAidAddress}: </span>
            {item.address}
          </p>
        ) : null}
      </div>

      <div className="border-t border-stone-100 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {item.phone ? (
          <a href={`tel:${item.phone.replace(/\s/g, '')}`} className="text-brand font-semibold hover:underline">
            {item.phone}
          </a>
        ) : null}
        {item.website ? (
          <a
            href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold hover:underline break-all"
          >
            {item.website.replace(/^https?:\/\//, '')}
          </a>
        ) : null}
        {!item.phone && !item.website ? (
          <span className="text-stone-400">{t.legalAidContactViaSource}</span>
        ) : null}
      </div>
    </article>
  );
}

export default function LegalAidPage() {
  const { lang, dir } = useLang();
  const t = T[lang];
  const [items, setItems] = useState<LegalAid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [helpsWith, setHelpsWith] = useState('');
  const [coverage, setCoverage] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (helpsWith) params.set('helps_with', helpsWith);
    if (coverage) params.set('coverage', coverage);
    const qs = params.toString();
    try {
      const res = await fetch(`/api/legal-aid${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = (await res.json()) as {
        items: LegalAid[];
        error?: string;
        source?: 'fallback' | 'database';
      };
      setItems(data.items ?? []);
      setUsingFallback(data.source === 'fallback');
      if (data.error && !data.items?.length) setError(t.legalAidLoadError);
    } catch {
      setItems([]);
      setError(t.legalAidLoadError);
    } finally {
      setLoading(false);
    }
  }, [helpsWith, coverage, t.legalAidLoadError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const activeFilterCount = useMemo(
    () => (helpsWith ? 1 : 0) + (coverage ? 1 : 0),
    [helpsWith, coverage],
  );

  return (
    <>
      <Header />
      <main className="max-w-[760px] mx-auto px-3.5 py-4 pb-10" dir={dir}>
        <Link
          href="/"
          className="inline-block text-brand text-sm font-semibold mb-4 hover:underline"
        >
          {t.back}
        </Link>

        <div className="bg-brand rounded-2xl px-5 py-6 mb-5 text-white text-center">
          <div className="text-3xl mb-2" aria-hidden="true">
            🤝
          </div>
          <h1 className="text-xl font-bold mb-1.5">{t.legalAidTitle}</h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-md mx-auto">{t.legalAidSub}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed mb-5">
          {t.legalAidReviewNote}
        </div>

        {usingFallback && (
          <div className="bg-stone-100 border border-stone-300 rounded-xl p-3 text-xs text-stone-700 leading-relaxed mb-5">
            {t.legalAidFallbackNote}
          </div>
        )}

        <div className="bg-white border-2 border-stone-200 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {t.legalAidFilterHeading}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-stone-600 mb-1 block">{t.legalAidFilterTopic}</span>
              <select
                value={helpsWith}
                onChange={(e) => setHelpsWith(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-white focus:outline-none focus:border-brand"
              >
                <option value="">{t.legalAidAllTopics}</option>
                {HELPS_WITH_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tagLabel(tag, t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-stone-600 mb-1 block">{t.legalAidFilterCoverage}</span>
              <select
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 bg-white focus:outline-none focus:border-brand"
              >
                <option value="">{t.legalAidAllCoverage}</option>
                {COVERAGE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setHelpsWith('');
                setCoverage('');
              }}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {t.legalAidClearFilters}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-stone-500 text-sm text-center py-8">{t.loading}</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 text-center">
            {error}
            <p className="text-xs text-red-600 mt-2">{t.legalAidSetupHint}</p>
          </div>
        ) : items.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-8">{t.legalAidNoResults}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-stone-500">
              {t.legalAidResultCount.replace('{n}', String(items.length))}
            </p>
            {items.map((item) => (
              <LegalAidCard key={item.id} item={item} t={t} />
            ))}
          </div>
        )}

        <p className="text-[11px] text-stone-500 text-center leading-relaxed mt-6 px-2">
          {t.legalAidFooter}
        </p>
      </main>
    </>
  );
}
