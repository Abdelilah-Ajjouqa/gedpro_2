'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, clearTokens, hasSession, saveTokens } from '@/lib/api-client';
import { login as loginRequest, type AuthSession, type AuthUser } from '@/lib/auth';

type AuthContextValue = {
  user?: AuthUser;
  isLoading: boolean;
  signIn(email: string, password: string): Promise<void>;
  acceptSession(session: AuthSession): void;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const profile = hasSession() ? apiRequest<AuthUser>('/users/profile') : Promise.resolve(undefined);
    void profile
      .then((value) => setUser(value))
      .catch(() => { clearTokens(); setUser(undefined); })
      .finally(() => setIsLoading(false));
  }, []);

  const acceptSession = useCallback((session: AuthSession) => {
    saveTokens(session.accessToken, session.refreshToken);
    setUser(session.user);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    acceptSession(await loginRequest(email, password));
  }, [acceptSession]);

  const signOut = useCallback(async () => {
    const refreshToken = window.localStorage.getItem('gedpro.refreshToken');
    if (refreshToken) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false).catch(() => undefined);
    clearTokens(); setUser(undefined); router.replace('/login'); router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, isLoading, signIn, acceptSession, signOut }), [user, isLoading, signIn, acceptSession, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
