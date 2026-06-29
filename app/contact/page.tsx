'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { CONTACT_EMAIL } from '@/components/Footer';
import { T, t as tr } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

export default function ContactPage() {
  const { lang, dir } = useLang();
  const t = T[lang];
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`MRA contact from ${name.trim() || 'visitor'}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\n\n${message.trim()}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <Header />
      <main className="max-w-[760px] mx-auto px-4 py-8 pb-12" dir={dir}>
        <Link
          href="/"
          className="inline-block text-brand text-sm font-semibold mb-6 hover:underline"
        >
          {t.back}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-brand text-white text-sm font-black w-10 h-10 rounded-lg tracking-tight mb-3">
            MRA
          </div>
          <h1 className="text-xl font-bold text-stone-800">{t.contactTitle}</h1>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {t.contactSub}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm mb-6">
          <p className="text-sm text-stone-600 mb-2">{t.emailDirectly}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand font-semibold text-base hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs text-stone-400 mt-3 leading-relaxed">
            {t.contactLawNote}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-stone-800 mb-4">{t.sendMessage}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-medium text-stone-600 mb-1.5">
                {t.yourName}
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t.namePlaceholder}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                dir={dir}
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-xs font-medium text-stone-600 mb-1.5">
                {t.message}
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder={t.messagePlaceholder}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-y min-h-[120px]"
                dir={dir}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors"
            >
              {t.openEmailApp}
            </button>
          </form>
          <p className="text-[11px] text-stone-400 text-center mt-4 leading-relaxed">
            {tr(lang, 'mailtoNote', { email: CONTACT_EMAIL })}
          </p>
        </div>
      </main>
    </>
  );
}
