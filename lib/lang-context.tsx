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
    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'lang-context.tsx:apply',message:'lang applied to document',data:{lang,dir:lang==='ur'?'rtl':'ltr',htmlDir:document.documentElement.dir,htmlLang:document.documentElement.lang,fontUrdu:document.body.classList.contains('font-urdu')},timestamp:Date.now(),hypothesisId:'D-E',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/c5e61894-d46a-400f-bd9c-76e07d041967',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b10a3d'},body:JSON.stringify({sessionId:'b10a3d',location:'lang-context.tsx:setLang',message:'language toggled',data:{newLang:l},timestamp:Date.now(),hypothesisId:'A-B',runId:'post-fix'})}).catch(()=>{});
    // #endregion
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
