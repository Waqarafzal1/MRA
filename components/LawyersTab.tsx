'use client';

import { useState, useEffect } from 'react';
import type { Lawyer } from '@/lib/types';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi',
  'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
];
const SPECS = [
  'Family Law', 'Criminal Law', 'Property Law', 'Labour Law',
  'Corporate Law', "Women's Rights", 'Cybercrime',
];

function LawyerCard({ l, whatsappLabel }: { l: Lawyer; whatsappLabel: string }) {
  const waNumber = l.phone.replace(/-/g, '').replace(/^0/, '92');
  return (
    <div className="bg-white border-2 border-stone-200 rounded-xl p-3.5 flex items-start gap-3">
      <div className="w-11 h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center text-lg font-bold flex-shrink-0">
        {l.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-stone-800">{l.name}</div>
        <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-semibold px-1.5 py-0.5 rounded my-0.5">
          {l.spec}
        </span>
        <div className="text-xs text-stone-500 mt-0.5">
          <span className="me-2.5">📍 {l.city}</span>
          <span className="me-2.5">⚖️ {l.court}</span>
          <span>🕐 {l.exp}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <a
            href={`tel:${l.phone}`}
            className="bg-brand text-white text-xs font-semibold px-3 py-2 rounded-lg no-underline hover:bg-brand/90 transition-colors min-h-[36px] flex items-center"
          >
            📞 {l.phone}
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="bg-wa-green text-white text-xs font-semibold px-3 py-2 rounded-lg no-underline hover:opacity-90 transition-opacity min-h-[36px] flex items-center"
          >
            💬 {whatsappLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LawyersTab() {
  const { lang, dir } = useLang();
  const t = T[lang];
  const [city, setCity] = useState('');
  const [spec, setSpec] = useState('');
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);

  useEffect(() => {
    fetch('/api/lawyers')
      .then((r) => r.json())
      .then((data) => setLawyers(data.lawyers ?? []))
      .catch(() => {});
  }, []);

  const filtered = lawyers.filter(
    (l) => (!city || l.city === city) && (!spec || l.spec === spec),
  );

  return (
    <div dir={dir}>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex gap-2 items-start mt-3.5">
        <span>ℹ️</span>
        <span>{t.lawyerDisclaimer}</span>
      </div>

      <div className="flex gap-2 flex-wrap my-3.5">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2.5 border-2 border-stone-200 rounded-lg text-sm text-stone-700 bg-white outline-none focus:border-brand cursor-pointer"
        >
          <option value="">{t.allCities}</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2.5 border-2 border-stone-200 rounded-lg text-sm text-stone-700 bg-white outline-none focus:border-brand cursor-pointer"
        >
          <option value="">{t.allSpecs}</option>
          {SPECS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="text-center text-stone-400 text-sm py-8">
            🔍 {t.noResults}
          </div>
        ) : (
          filtered.map((l, i) => (
            <LawyerCard key={i} l={l} whatsappLabel={t.whatsappBtn} />
          ))
        )}
      </div>

      <div
        className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 mt-3.5 mb-20"
        dangerouslySetInnerHTML={{ __html: t.barNote }}
      />
    </div>
  );
}
