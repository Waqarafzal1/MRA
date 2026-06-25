import type { Lang } from '@/lib/types';
import { T } from '@/lib/translations';

export default function WhatsAppTab({ lang }: { lang: Lang }) {
  const t = T[lang];
  const isUr = lang === 'ur';

  const steps = [
    { id: 'step1', html: t.step1 },
    { id: 'step2', html: t.step2 },
    { id: 'step3', html: t.step3 },
    { id: 'step4', html: t.step4 },
  ];

  return (
    <div className="pt-3.5" dir={isUr ? 'rtl' : 'ltr'}>
      {/* Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3.5 mb-3 flex flex-wrap items-center gap-3">
        <div className="text-3xl flex-shrink-0">📱</div>
        <div className="flex-1 min-w-[140px]">
          <h3 className={`text-sm font-bold text-green-800 mb-0.5 ${isUr ? 'font-urdu' : ''}`}>
            {t.waTitle}
          </h3>
          <p className={`text-xs text-gray-600 ${isUr ? 'font-urdu' : ''}`}>{t.waDesc}</p>
        </div>
        <a
          href="https://wa.me/923345000073?text=Assalamu+Alaikum%2C+mujhe+qanooni+madad+chahiye"
          target="_blank"
          rel="noreferrer"
          className={`bg-wa-green text-white rounded-lg px-3.5 py-2.5 text-sm font-bold whitespace-nowrap no-underline hover:opacity-90 transition-opacity min-h-[44px] flex items-center ${isUr ? 'font-urdu' : ''}`}
        >
          {t.waBtn}
        </a>
      </div>

      {/* How it works */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-3">
        <div className={`text-sm font-bold text-gray-800 mb-2.5 ${isUr ? 'font-urdu' : ''}`}>
          {t.howTitle}
        </div>
        <div className="flex flex-col gap-2.5">
          {steps.map((s, i) => (
            <div key={s.id} className="flex gap-2.5 items-start">
              <div className="w-6 h-6 rounded-full bg-green-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div
                className={`text-sm text-gray-600 ${isUr ? 'font-urdu' : ''}`}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
        <strong>{isUr ? 'نوٹ:' : 'Note:'}</strong>{' '}
        <span className={isUr ? 'font-urdu' : ''}>{t.waNote}</span>
      </div>
    </div>
  );
}
