'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconScale, IconLogout, IconChevronDown } from '@tabler/icons-react';
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
    <div className="sticky top-0 z-50 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white shadow-card">
      {/* subtle top glass highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
      <div className="max-w-[760px] mx-auto px-4 py-2.5 flex items-center justify-between gap-2.5">
        {/* Logo + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/95 text-brand-700 shadow-soft flex-shrink-0 ring-1 ring-white/40">
            <IconScale size={20} stroke={1.9} />
          </div>
          <div className="min-w-0">
            <h1
              className={`font-display text-[15px] font-extrabold leading-tight tracking-tight truncate ${
                lang === 'ur' ? 'font-urdu' : ''
              }`}
            >
              {t.appTitle}
            </h1>
            <p className="text-[10px] font-medium text-white/60 truncate">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language toggle */}
          <div className="flex items-center bg-black/15 rounded-lg p-0.5 gap-0.5 ring-1 ring-white/10">
            <button
              onClick={() => onLangChange('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'en' ? 'bg-white text-brand-800 shadow-soft' : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLangChange('ur')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === 'ur' ? 'bg-white text-brand-800 shadow-soft' : 'text-white/70 hover:text-white'
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
                className="flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors ring-1 ring-white/15"
                title={userEmail}
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-brand-800 text-xs font-bold uppercase">
                  {userEmail[0]}
                </span>
                <IconChevronDown
                  size={14}
                  stroke={2.2}
                  className={`text-white/80 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 w-60 card-pop py-2 z-50 animate-fade-in text-slate-800">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-50 text-brand-700 text-sm font-bold uppercase flex-shrink-0">
                      {userEmail[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">Signed in as</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 mt-1 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <IconLogout size={17} stroke={1.9} />
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
