'use client';

import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { isLocalhost } from '@/lib/dev';
import { useLang } from '@/lib/lang-context';
import { T } from '@/lib/translations';
import { usePathname, useRouter } from 'next/navigation';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignInPanel({ intent }: { intent: 'citizen' | 'lawyer' }) {
  const { signInOpen, closeSignIn, signInMessage } = useAuth();
  const { lang, dir, isUr } = useLang();
  const t = T[lang];
  const pathname = usePathname();
  const router = useRouter();
  const localDev = typeof window !== 'undefined' && isLocalhost();

  if (!signInOpen) return null;

  async function handleGoogle(nextPath: string) {
    if (isLocalhost()) return;

    const supabase = createClient();
    const returnTo =
      pathname === '/'
        ? nextPath
        : `${pathname}${window.location.search}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
      },
    });
  }

  function handleLawyerRegister() {
    if (isLocalhost()) {
      closeSignIn();
      router.push('/?tab=register');
      return;
    }
    handleGoogle('/?tab=register');
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={closeSignIn}
      role="presentation"
    >
      <div
        className={`bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl p-6 ${isUr ? 'font-urdu' : ''}`}
        dir={dir}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="signin-title" className="text-lg font-bold text-stone-800">
            {t.signInTitle}
          </h2>
          <button
            type="button"
            onClick={closeSignIn}
            className="text-stone-400 hover:text-stone-600 text-xl leading-none p-1"
            aria-label={t.close}
          >
            ×
          </button>
        </div>

        {signInMessage && (
          <p className="text-sm text-stone-700 bg-brand/5 border border-brand/20 rounded-lg px-3 py-2.5 mb-4 leading-relaxed">
            {signInMessage}
          </p>
        )}

        {localDev && (
          <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 mb-4">
            {t.localDevNote}
          </p>
        )}

        <button
          type="button"
          disabled={localDev}
          onClick={() => handleGoogle('/')}
          className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-xl py-3 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <GoogleIcon />
          {t.continueGoogle}
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-xs text-stone-400">{t.areYouLawyer}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLawyerRegister}
          className="w-full border-2 border-brand rounded-xl py-3 px-4 text-sm font-semibold text-brand hover:bg-brand/5 transition-colors"
        >
          {t.registerLawyer}
        </button>

        <p className="text-xs text-stone-500 text-center mt-5 leading-relaxed">
          {t.signInDisclaimer}
        </p>

        {intent === 'lawyer' && (
          <p className="text-xs text-brand text-center mt-2">
            {t.lawyerSignInHint}
          </p>
        )}
      </div>
    </div>
  );
}
