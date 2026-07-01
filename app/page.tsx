'use client';

import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { IconScale, IconBrandWhatsapp, IconGavel, IconUserPlus } from '@tabler/icons-react';
import Header from '@/components/Header';
import AskTab from '@/components/AskTab';
import WhatsAppTab from '@/components/WhatsAppTab';
import LawyersTab from '@/components/LawyersTab';
import RegisterTab from '@/components/RegisterTab';
import type { Lang, Tab } from '@/lib/types';
import { T } from '@/lib/translations';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const [tab, setTab] = useState<Tab>('ask');
  const [lang, setLang] = useState<Lang>('en');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const t = T[lang];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const tabs: { id: Tab; icon: ComponentType<{ size?: number | string; stroke?: number | string }>; label: string }[] = [
    { id: 'ask',      icon: IconScale,         label: t.tabAsk },
    { id: 'whatsapp', icon: IconBrandWhatsapp, label: t.tabWa },
    { id: 'lawyers',  icon: IconGavel,         label: t.tabLawyers },
    { id: 'register', icon: IconUserPlus,      label: t.tabRegister },
  ];

  return (
    <>
      <Header lang={lang} onLangChange={setLang} userEmail={userEmail} />

      {/* Tab bar */}
      <div className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-[53px] z-40">
        <div className="max-w-[760px] mx-auto flex px-2 gap-1">
          {tabs.map(({ id, icon: Ic, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex-1 min-h-[48px] py-2 px-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  active ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Ic size={20} stroke={active ? 2 : 1.7} />
                <span className="truncate max-w-full">{label}</span>
                <span
                  className={`absolute bottom-0 h-0.5 rounded-full bg-brand-600 transition-all duration-200 ${
                    active ? 'w-8 opacity-100' : 'w-0 opacity-0'
                  }`}
                />
              </button>
            );
          })}
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
