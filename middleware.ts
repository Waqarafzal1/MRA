import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { pathname } = request.nextUrl;

  // Helper: redirect unauthenticated users away from protected routes.
  function redirectToLogin() {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If env vars are missing, protect routes conservatively.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname === '/') return redirectToLogin();
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // IMPORTANT: setAll must reassign supabaseResponse so refreshed session
        // cookies propagate to the browser. Do not move this logic.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // IMPORTANT: do NOT add logic between createServerClient and getUser().
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // getUser() failed (network error, unexpected key format, etc.).
    // Default to unauthenticated — the login page handles the retry.
    user = null;
  }

  // Main app requires login.
  if (pathname === '/' && !user) return redirectToLogin();

  // Bounce authenticated users away from auth pages.
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|auth/callback|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
