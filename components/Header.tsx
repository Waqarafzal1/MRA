'use client';

import type { Lang } from '@/lib/types';
import { T } from '@/lib/translations';

interface HeaderProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export default function Header({ lang, onLangChange }: HeaderProps) {
  const t = T[lang];
  return (
    <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-[760px] mx-auto px-4 py-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-white text-green-800 text-sm font-black px-2.5 py-1 rounded-lg tracking-tight flex-shrink-0">
            MRA
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm font-bold leading-tight truncate ${lang === 'ur' ? 'font-urdu' : ''}`}>
              {t.appTitle}
            </h1>
            <p className="text-[10px] opacity-70 truncate">{t.appSubtitle}</p>
          </div>
        </div>

        <div className="flex bg-white/15 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => onLangChange('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              lang === 'en' ? 'bg-white text-green-800' : 'text-white/75 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLangChange('ur')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              lang === 'ur' ? 'bg-white text-green-800' : 'text-white/75 hover:text-white'
            }`}
          >
            اردو
          </button>
        </div>
      </div>
    </div>
  );
}
