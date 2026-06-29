'use client';

import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

export default function WhatsAppTab() {
  const { dir } = useLang();
  const t = T[lang];

  const steps = [
    { n: 1, html: t.step1 },
    { n: 2, html: t.step2 },
    { n: 3, html: t.step3 },
    { n: 4, html: t.step4 },
  ];

  return (
    <div className="pt-3.5" dir={dir}>
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 mb-4">
        <span className="text-3xl">💬</span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-brand mb-0.5">{t.waTitle}</h3>
          <p className="text-xs text-stone-600">{t.waDesc}</p>
        </div>
        <a
          href="https://wa.me/923345000073"
          target="_blank"
          rel="noreferrer"
          className="bg-wa-green text-white rounded-lg px-3.5 py-2.5 text-sm font-bold whitespace-nowrap no-underline hover:opacity-90 transition-opacity min-h-[44px] flex items-center"
        >
          {t.waBtn}
        </a>
      </div>

      <div className="bg-white border-2 border-stone-200 rounded-xl p-4">
        <div className="text-sm font-bold text-stone-800 mb-2.5">{t.howTitle}</div>
        <ol className="space-y-2.5">
          {steps.map(({ n, html }) => (
            <li key={n} className="flex gap-2.5 text-sm text-stone-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">
                {n}
              </span>
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-stone-500 mt-3 leading-relaxed">
        <strong>{t.noteLabel}</strong> {t.waNote}
      </p>
    </div>
  );
}
