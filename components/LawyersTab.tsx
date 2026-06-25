'use client';

import { useState, useEffect } from 'react';
import type { Lang, Lawyer } from '@/lib/types';
import { T } from '@/lib/translations';

const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi',
  'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
];
const SPECS = [
  'Family Law', 'Criminal Law', 'Property Law', 'Labour Law',
  'Corporate Law', "Women's Rights", 'Cybercrime',
];

function LawyerCard({ l }: { l: Lawyer }) {
  const waNumber = l.phone.replace(/-/g, '').replace(/^0/, '92');
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-3.5 flex items-start gap-3">
      <div className="w-11 h-11 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-lg font-bold flex-shrink-0">
        {l.avatar}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-gray-800">{l.name}</div>
        <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-semibold px-1.5 py-0.5 rounded my-0.5">
          {l.spec}
        </span>
        <div className="text-xs text-gray-500 mt-0.5">
          <span className="mr-2.5">📍 {l.city}</span>
          <span className="mr-2.5">⚖️ {l.court}</span>
          <span>🕐 {l.exp}</span>
        </div>
        <div className="flex gap-1.5 mt-2">
          <a
            href={`tel:${l.phone}`}
            className="bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg no-underline hover:bg-green-700 transition-colors"
          >
            📞 {l.phone}
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="bg-wa-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LawyersTab({ lang }: { lang: Lang }) {
  const t = T[lang];
  const isUr = lang === 'ur';
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
    <div dir={isUr ? 'rtl' : 'ltr'}>
      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-xs text-yellow-800 flex gap-2 items-start mt-3.5">
        <span>ℹ️</span>
        <span className={isUr ? 'font-urdu' : ''}>{t.lawyerDisclaimer}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap my-3.5">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:border-green-500 cursor-pointer"
        >
          <option value="">{t.allCities}</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 bg-white outline-none focus:border-green-500 cursor-pointer"
        >
          <option value="">{t.allSpecs}</option>
          {SPECS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            🔍 {t.noResults}
          </div>
        ) : (
          filtered.map((l, i) => <LawyerCard key={i} l={l} />)
        )}
      </div>

      {/* Bar Council note */}
      <div
        className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 mt-3.5 mb-20"
        dangerouslySetInnerHTML={{ __html: t.barNote }}
      />
    </div>
  );
}
