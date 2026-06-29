'use client';

import { useState, useRef, useEffect } from 'react';
import { T } from '@/lib/translations';
import { useAuth } from '@/lib/auth-context';
import { useLang } from '@/lib/lang-context';

export default function Header() {
  const { lang, setLang, isUr, dir } = useLang();
  const t = T[lang];
  const { userEmail, openSignIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="bg-brand text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-[760px] mx-auto px-4 py-3 flex items-center justify-between gap-2.5" dir={dir}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-white text-brand text-sm font-black px-2.5 py-1 rounded-lg tracking-tight flex-shrink-0">
            MRA
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm font-bold leading-tight truncate ${isUr ? 'font-urdu' : ''}`}>
              {t.appTitle}
            </h1>
            <p className={`text-[10px] opacity-70 truncate ${isUr ? '' : 'font-urdu'}`}>
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex bg-white/15 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'en' ? 'bg-white text-brand' : 'text-white/75 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ur')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'ur' ? 'bg-white text-brand' : 'text-white/75 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>

          {userEmail ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-bold uppercase"
                title={userEmail}
              >
                {userEmail[0]}
              </button>
              {menuOpen && (
                <div className={`absolute top-10 w-56 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-50 ${isUr ? 'left-0' : 'right-0'}`}>
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs text-stone-500">{t.signedInAs}</p>
                    <p className="text-xs font-semibold text-stone-800 truncate">{userEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {t.signOut}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn('citizen')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {t.signIn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
