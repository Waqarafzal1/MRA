import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// @supabase/ssr uses Node.js crypto APIs internally — must not run on Edge.
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Supabase/Google sends error params directly when the provider-side exchange fails
  // (e.g. error=server_error&error_code=unexpected_failure). Log them so they appear
  // in Vercel runtime logs instead of silently becoming a generic redirect.
  const providerError = searchParams.get('error');
  if (providerError) {
    console.error('[auth/callback] Provider returned error before code exchange:', {
      error: providerError,
      error_code: searchParams.get('error_code'),
      error_description: searchParams.get('error_description'),
    });
    return NextResponse.redirect(new URL('/?signin=error', origin));
  }

  if (!code) {
    console.warn('[auth/callback] No code parameter — URL params:', Object.fromEntries(searchParams));
    return NextResponse.redirect(new URL('/?signin=error', origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth/callback] Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return NextResponse.redirect(new URL('/?signin=error', origin));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return NextResponse.redirect(new URL(next, origin));
  }

  console.error('[auth/callback] exchangeCodeForSession failed:', {
    message: error.message,
    status: (error as { status?: number }).status,
    name: error.name,
  });

  return NextResponse.redirect(new URL('/?signin=error', origin));
}
