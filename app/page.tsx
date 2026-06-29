'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import HomeTab from '@/components/HomeTab';
import WhatsAppTab from '@/components/WhatsAppTab';
import LawyersTab from '@/components/LawyersTab';
import RegisterTab from '@/components/RegisterTab';
import type { Tab } from '@/lib/types';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

export default function Home() {
  const { lang, dir } = useLang();
  const t = T[lang];
  const [tab, setTab] = useState<Tab>('ask');

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'register' || tabParam === 'ask' || tabParam === 'whatsapp' || tabParam === 'lawyers') {
      setTab(tabParam);
    }
  }, []);

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'ask',      icon: '⚖️', label: t.tabAsk },
    { id: 'whatsapp', icon: '💬', label: t.tabWa },
    { id: 'lawyers',  icon: '👨‍⚖️', label: t.tabLawyers },
    { id: 'register', icon: '📝', label: t.tabRegister },
  ];

  return (
    <>
      <Header />

      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-40" dir={dir}>
        <div className="max-w-[760px] mx-auto flex flex-wrap sm:flex-nowrap">
          {tabs.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-1/2 sm:flex-1 sm:w-auto min-h-[44px] py-2 px-2 border-none bg-transparent text-xs font-semibold flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${
                tab === id
                  ? 'text-brand border-b-brand'
                  : 'text-gray-400 border-b-transparent hover:text-gray-600'
              }`}
            >
              <span className="flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[760px] mx-auto px-3.5">
        {tab === 'ask'      && <HomeTab onTabChange={setTab} />}
        {tab === 'whatsapp' && <WhatsAppTab />}
        {tab === 'lawyers'  && <LawyersTab />}
        {tab === 'register' && <RegisterTab onTabChange={setTab} />}
      </main>
    </>
  );
}
