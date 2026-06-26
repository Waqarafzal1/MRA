'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Lang } from '@/lib/types';
import { T } from '@/lib/translations';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  userEmail?: string | null;
}

export default function Header({ lang, onLangChange, userEmail }: HeaderProps) {
  const t = T[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-[760px] mx-auto px-4 py-3 flex items-center justify-between gap-2.5">
        {/* Logo + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-white text-green-800 text-sm font-black px-2.5 py-1 rounded-lg tracking-tight flex-shrink-0">
            MRA
          </div>
          <div className="min-w-0">
            <h1
              className={`text-sm font-bold leading-tight truncate ${lang === 'ur' ? 'font-urdu' : ''}`}
            >
              {t.appTitle}
            </h1>
            <p className="text-[10px] opacity-70 truncate">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language toggle */}
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

          {/* User menu */}
          {userEmail && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-bold uppercase"
                title={userEmail}
              >
                {userEmail[0]}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
