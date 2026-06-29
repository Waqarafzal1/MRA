'use client';

import { useEffect, useState } from 'react';
import type { LegalNews } from '@/lib/types';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

export default function LegalNewsStrip() {
  const { lang, dir } = useLang();
  const t = T[lang];
  const [items, setItems] = useState<LegalNews[]>([]);

  useEffect(() => {
    fetch('/api/legal-news')
      .then((r) => r.json())
      .then((data: { items?: LegalNews[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mb-6" dir={dir}>
      <h2 className="text-sm font-bold text-stone-800 mb-3">{t.legalNewsTitle}</h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const date = new Date(item.publishedDate).toLocaleDateString(
            lang === 'ur' ? 'ur-PK' : 'en-PK',
            { day: 'numeric', month: 'short', year: 'numeric' },
          );
          return (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white border border-stone-200 border-l-4 border-l-brand rounded-r-xl rounded-l-md p-4 hover:bg-stone-50 hover:border-stone-300 transition-colors no-underline"
            >
              <p className="text-sm font-bold text-stone-800 mb-1 leading-snug">
                {item.headline}
              </p>
              <p className="text-xs text-stone-600 leading-relaxed mb-2">{item.summary}</p>
              <p className="text-[11px] text-stone-400">
                {item.sourceName} · {date}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
