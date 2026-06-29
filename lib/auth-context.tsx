'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SignInPanel from '@/components/SignInPanel';

export type SignInIntent = 'citizen' | 'lawyer';

interface AuthContextValue {
  userEmail: string | null;
  signInOpen: boolean;
  signInMessage: string | null;
  openSignIn: (intent?: SignInIntent, message?: string) => void;
  closeSignIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInIntent, setSignInIntent] = useState<SignInIntent>('citizen');
  const [signInMessage, setSignInMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const openSignIn = useCallback((intent: SignInIntent = 'citizen', message?: string) => {
    setSignInIntent(intent);
    setSignInMessage(message ?? null);
    setSignInOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setSignInOpen(false);
    setSignInMessage(null);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push('/');
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ userEmail, signInOpen, signInMessage, openSignIn, closeSignIn, signOut }}
    >
      {children}
      <SignInPanel intent={signInIntent} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
