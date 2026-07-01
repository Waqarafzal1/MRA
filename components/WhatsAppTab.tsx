import { IconBrandWhatsapp, IconInfoCircle } from '@tabler/icons-react';
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
      <div className="relative overflow-hidden rounded-2xl p-4 mb-3 flex flex-wrap items-center gap-3 bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-card">
        <div className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 flex-shrink-0 ring-1 ring-white/20">
          <IconBrandWhatsapp size={26} stroke={1.9} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <h3 className={`font-display text-sm font-bold mb-0.5 ${isUr ? 'font-urdu' : ''}`}>
            {t.waTitle}
          </h3>
          <p className={`text-xs text-white/75 ${isUr ? 'font-urdu' : ''}`}>{t.waDesc}</p>
        </div>
        <a
          href="https://wa.me/923345000073?text=Assalamu+Alaikum%2C+mujhe+qanooni+madad+chahiye"
          target="_blank"
          rel="noreferrer"
          className={`btn btn-wa whitespace-nowrap min-h-[44px] relative z-10 ${isUr ? 'font-urdu' : ''}`}
        >
          <IconBrandWhatsapp size={18} stroke={1.9} />
          {t.waBtn}
        </a>
      </div>

      {/* How it works */}
      <div className="card p-4 mb-3">
        <div className={`text-sm font-bold text-slate-800 mb-3 ${isUr ? 'font-urdu' : ''}`}>
          {t.howTitle}
        </div>
        <div className="relative flex flex-col gap-4">
          {/* connector line */}
          <div className="absolute top-3 bottom-3 start-3 w-px bg-slate-200" aria-hidden />
          {steps.map((s, i) => (
            <div key={s.id} className="relative flex gap-3 items-start">
              <div className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-soft">
                {i + 1}
              </div>
              <div
                className={`text-sm text-slate-600 pt-0.5 leading-relaxed ${isUr ? 'font-urdu' : ''}`}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex gap-2.5 items-start">
        <IconInfoCircle size={16} stroke={1.9} className="flex-shrink-0 mt-0.5 text-amber-500" />
        <div>
          <strong>{isUr ? 'نوٹ:' : 'Note:'}</strong>{' '}
          <span className={isUr ? 'font-urdu' : ''}>{t.waNote}</span>
        </div>
      </div>
    </div>
  );
}
