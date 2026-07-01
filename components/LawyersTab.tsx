'use client';

import { useState, useEffect } from 'react';
import {
  IconMapPin,
  IconGavel,
  IconClock,
  IconPhone,
  IconBrandWhatsapp,
  IconSearch,
  IconInfoCircle,
  IconChevronDown,
} from '@tabler/icons-react';
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
    <div className="card p-4 flex items-start gap-3.5 transition-shadow hover:shadow-card">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-soft">
        {l.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-800">{l.name}</div>
        <span className="badge bg-brand-50 text-brand-700 my-1">{l.spec}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
          <span className="inline-flex items-center gap-1">
            <IconMapPin size={13} stroke={1.8} className="text-slate-400" /> {l.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconGavel size={13} stroke={1.8} className="text-slate-400" /> {l.court}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconClock size={13} stroke={1.8} className="text-slate-400" /> {l.exp}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <a
            href={`tel:${l.phone}`}
            className="btn btn-primary btn-sm min-h-[36px]"
          >
            <IconPhone size={15} stroke={1.9} /> {l.phone}
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-wa btn-sm min-h-[36px]"
          >
            <IconBrandWhatsapp size={15} stroke={1.9} /> WhatsApp
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
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex gap-2.5 items-start mt-3.5">
        <IconInfoCircle size={16} stroke={1.9} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <span className={`leading-relaxed ${isUr ? 'font-urdu' : ''}`}>{t.lawyerDisclaimer}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap my-3.5">
        <div className="relative flex-1 min-w-[140px]">
          <IconMapPin size={16} stroke={1.8} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="field appearance-none ps-9 pe-9 cursor-pointer"
          >
            <option value="">{t.allCities}</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <IconChevronDown size={16} stroke={1.8} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <IconGavel size={16} stroke={1.8} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            className="field appearance-none ps-9 pe-9 cursor-pointer"
          >
            <option value="">{t.allSpecs}</option>
            {SPECS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <IconChevronDown size={16} stroke={1.8} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center text-slate-400 text-sm py-10 gap-2">
            <IconSearch size={28} stroke={1.6} className="text-slate-300" />
            {t.noResults}
          </div>
        ) : (
          filtered.map((l, i) => <LawyerCard key={i} l={l} />)
        )}
      </div>

      {/* Bar Council note */}
      <div
        className="card bg-slate-50/80 p-3.5 text-xs text-slate-600 mt-3.5 mb-20 leading-relaxed [&_a]:text-brand-700 [&_a]:font-medium [&_a:hover]:underline"
        dangerouslySetInnerHTML={{ __html: t.barNote }}
      />
    </div>
  );
}
