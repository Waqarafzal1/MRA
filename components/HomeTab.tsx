'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FreeQuestionsCounter from '@/components/FreeQuestionsCounter';
import type { Tab } from '@/lib/types';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

const FEATURED = [
  {
    ref: 'Article 10-A',
    titleEn: 'Right to a fair trial',
    titleUr: 'منصفانہ ٹرائل کا حق',
    descEn: 'Constitutional safeguards for a fair hearing in court.',
    descUr: 'عدالت میں منصفانہ سماعت کے لیے آئینی تحفظات۔',
    q: 'fair trial rights',
  },
  {
    ref: 'Section 154',
    titleEn: 'Filing an FIR',
    titleUr: 'ایف آئی آر درج کروانا',
    descEn: 'How a First Information Report is recorded by police.',
    descUr: 'پولیس کیسے پہلی اطلاعی رپورٹ درج کرتی ہے۔',
    q: 'filing FIR police',
  },
  {
    ref: 'Section 489-F',
    titleEn: 'Bounced cheque',
    titleUr: 'چیک واپس ہونا',
    descEn: 'Law on dishonoured cheques and criminal liability.',
    descUr: 'ناقابلِ ادائیگی چیک اور مجرمانہ ذمہ داری۔',
    q: 'cheque bounce dishonour',
  },
  {
    ref: 'Article 25',
    titleEn: 'Equality of citizens',
    titleUr: 'شہریوں کی مساوات',
    descEn: 'All citizens are equal before the law.',
    descUr: 'تمام شہری قانون کے سامنے برابر ہیں۔',
    q: 'equality of citizens Article 25',
  },
];

const SITUATIONS = [
  {
    icon: '🚔',
    en: 'Police arrested or detained someone unfairly',
    ur: 'پولیس نے ناجائز طریقے سے گرفتار کیا',
    q: 'unlawful arrest bail rights Pakistan',
  },
  {
    icon: '🏠',
    en: 'My landlord is threatening to evict me',
    ur: 'مکان مالک مجھے بے دخل کرنے کی دھمکی دے رہا ہے',
    q: 'tenant eviction rights Pakistan',
  },
  {
    icon: '👷',
    en: "My employer hasn't paid my salary",
    ur: 'آجر نے تنخواہ نہیں دی',
    q: 'unpaid salary wages labour rights Pakistan',
  },
  {
    icon: '👨‍👩‍👧',
    en: 'I need help with a family or divorce matter',
    ur: 'طلاق یا خاندانی معاملے میں مدد چاہیے',
    q: 'family law divorce rights Pakistan',
  },
];

export default function HomeTab({
  onTabChange,
}: {
  onTabChange: (tab: Tab) => void;
}) {
  const { lang, isUr, dir } = useLang();
  const t = T[lang];
  const [query, setQuery] = useState('');
  const router = useRouter();

  const navigate = (q: string) => {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div dir={dir}>
      <div className="bg-brand rounded-2xl px-5 py-7 my-4 text-white text-center">
        <div className="text-4xl mb-2">⚖️</div>
        <h1 className="text-xl font-bold mb-1.5">{t.knowYourRights}</h1>
        <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">
          {t.heroSub}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate(query);
        }}
        className="flex gap-2 mb-1"
        dir={dir}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 px-4 py-3 border-2 border-stone-200 rounded-xl text-sm outline-none focus:border-brand font-[inherit]"
          dir={dir}
        />
        <button
          type="submit"
          className="bg-brand text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-brand/90 transition-colors whitespace-nowrap"
        >
          {t.search}
        </button>
      </form>

      <FreeQuestionsCounter />

      <div className="mb-6">
        <h2 className="text-sm font-bold text-stone-800 mb-3">{t.knowRightsToday}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURED.map((item) => (
            <button
              key={item.ref}
              type="button"
              onClick={() => navigate(item.q)}
              className="bg-white border border-stone-200 border-l-4 border-l-brand rounded-r-xl rounded-l-md p-4 hover:bg-stone-50 hover:border-stone-300 transition-colors w-full text-start"
            >
              <p className="text-[11px] font-semibold text-brand mb-1">{item.ref}</p>
              <p className="text-sm font-bold text-stone-800 mb-1">
                {isUr ? item.titleUr : item.titleEn}
              </p>
              <p className="text-xs text-stone-500 leading-relaxed">
                {isUr ? item.descUr : item.descEn}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
        {t.commonSituations}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {SITUATIONS.map((s) => (
          <button
            key={s.en}
            onClick={() => navigate(s.q)}
            className="bg-white border-2 border-stone-200 rounded-xl p-3.5 hover:border-brand/50 hover:bg-brand/5 transition-all flex items-center gap-3 text-start w-full"
          >
            <span className="text-2xl flex-shrink-0">{s.icon}</span>
            <span className="text-sm font-medium text-stone-700">
              {isUr ? s.ur : s.en}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => onTabChange('lawyers')}
        className="w-full bg-brand/5 border-2 border-brand/20 rounded-xl p-4 flex items-center gap-3 hover:bg-brand/10 transition-colors mb-5"
      >
        <span className="text-2xl">👨‍⚖️</span>
        <div className="flex-1 text-start">
          <div className="font-bold text-brand text-sm">{t.connectLawyer}</div>
          <div className="text-brand/80 text-xs mt-0.5">{t.connectLawyerSub}</div>
        </div>
        <span className="text-brand text-lg flex-shrink-0">{isUr ? '←' : '→'}</span>
      </button>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start text-xs text-amber-900 mb-6">
        <span className="flex-shrink-0">⚠️</span>
        <span>{t.disclaimer}</span>
      </div>
    </div>
  );
}
