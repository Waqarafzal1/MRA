'use client';

import { AuthProvider } from '@/lib/auth-context';
import { LangProvider } from '@/lib/lang-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>{children}</AuthProvider>
    </LangProvider>
  );
}
