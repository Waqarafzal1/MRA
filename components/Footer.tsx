'use client';

import Link from 'next/link';
import { T } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

const CONTACT_EMAIL = 'info@my-rights-app.com';

export default function Footer() {
  const { lang, dir } = useLang();
  const t = T[lang];

  return (
    <footer className="border-t border-stone-200 bg-stone-50 mt-auto py-5 px-4">
      <div
        className="max-w-[760px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500"
        dir={dir}
      >
        <p className="text-stone-400">{t.footerTag}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/contact" className="text-stone-600 hover:text-brand transition-colors">
            {t.contact}
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand font-medium hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
      <p className="max-w-[760px] mx-auto text-center text-[10px] text-stone-400 mt-2" dir={dir}>
        {t.trustLine}
      </p>
    </footer>
  );
}

export { CONTACT_EMAIL };
