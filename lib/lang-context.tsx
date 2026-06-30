'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Lang } from '@/lib/types';

const LANG_KEY = 'mra_lang';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  isUr: boolean;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'ur' || stored === 'en') setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.classList.toggle('font-urdu', lang === 'ur');
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const isUr = lang === 'ur';
  const dir = isUr ? 'rtl' : 'ltr';

  return (
    <LangContext.Provider value={{ lang, setLang, isUr, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
