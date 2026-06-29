'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { T, t as tr } from '@/lib/translations';
import { useLang } from '@/lib/lang-context';

export default function LoginPage() {
  const { lang, dir, isUr } = useLang();
  const t = T[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setOauthError(true);
  }, []);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setFormError(error.message);
      setLoading(false);
    } else {
      router.replace('/');
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  const displayError = formError ?? (oauthError ? t.googleSignInFailed : null);

  return (
    <div className={`min-h-screen bg-stone-100 flex flex-col items-center justify-center px-4 py-10 ${isUr ? 'font-urdu' : ''}`} dir={dir}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-brand text-white text-base font-black w-12 h-12 rounded-xl tracking-tight mb-4">
            MRA
          </div>
          <h1 className="text-xl font-bold text-stone-800">{t.appTitle}</h1>
          <p className={`text-sm text-stone-500 mt-1 ${isUr ? '' : 'font-urdu'}`}>{t.appSubtitle}</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-stone-800">{t.signInTitle}</h2>
            <p className="text-sm text-stone-500 mt-1">{t.loginSub}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-stone-300 rounded-xl py-3 px-4 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors"
          >
            <GoogleIcon />
            {t.continueGoogle}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-stone-400">{t.or}</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-stone-600 mb-1.5">
                {t.email}
              </label>
              <div className="relative">
                <span className={`absolute top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none ${isUr ? 'right-3' : 'left-3'}`}>
                  <MailIcon />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  dir="ltr"
                  className={`w-full border border-stone-200 rounded-xl py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${isUr ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-stone-600 mb-1.5">
                {t.password}
              </label>
              <div className="relative">
                <span className={`absolute top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none ${isUr ? 'right-3' : 'left-3'}`}>
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className={`w-full border border-stone-200 rounded-xl py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ${isUr ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                />
              </div>
            </div>

            {displayError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          <p className="text-center text-xs text-stone-500 mt-5">
            {t.noAccount}{' '}
            <Link href="/signup" className="text-brand font-semibold hover:underline">
              {t.signUpFree}
            </Link>
          </p>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 text-center mt-5 leading-relaxed">
          <ShieldIcon />
          <span>{t.trustLine}</span>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
