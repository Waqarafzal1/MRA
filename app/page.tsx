'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import AskTab from '@/components/AskTab';
import WhatsAppTab from '@/components/WhatsAppTab';
import LawyersTab from '@/components/LawyersTab';
import RegisterTab from '@/components/RegisterTab';
import type { Lang, Tab } from '@/lib/types';
import { T } from '@/lib/translations';

export default function Home() {
  const [tab, setTab] = useState<Tab>('ask');
  const [lang, setLang] = useState<Lang>('en');
  const t = T[lang];

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'ask',      icon: '⚖️', label: t.tabAsk },
    { id: 'whatsapp', icon: '💬', label: t.tabWa },
    { id: 'lawyers',  icon: '👨‍⚖️', label: t.tabLawyers },
    { id: 'register', icon: '📝', label: t.tabRegister },
  ];

  return (
    <>
      <Header lang={lang} onLangChange={setLang} />

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-40">
        <div className="max-w-[760px] mx-auto flex flex-wrap sm:flex-nowrap">
          {tabs.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-1/2 sm:flex-1 sm:w-auto min-h-[44px] py-2 px-2 border-none bg-transparent text-xs font-semibold flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${
                tab === id
                  ? 'text-green-800 border-b-green-800'
                  : 'text-gray-400 border-b-transparent hover:text-gray-600'
              }`}
            >
              <span className="flex-shrink-0">{icon}</span>
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-[760px] mx-auto px-3.5">
        {tab === 'ask'      && <AskTab lang={lang} />}
        {tab === 'whatsapp' && <WhatsAppTab lang={lang} />}
        {tab === 'lawyers'  && <LawyersTab lang={lang} />}
        {tab === 'register' && <RegisterTab lang={lang} onTabChange={setTab} />}
      </main>
    </>
  );
}
