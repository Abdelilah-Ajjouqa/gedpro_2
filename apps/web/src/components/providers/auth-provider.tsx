'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, clearLegacySession } from '@/lib/api-client';
import {
  getCurrentUser,
  login as loginRequest,
  type AuthSession,
  type AuthUser,
} from '@/lib/auth';

type AuthContextValue = {
  user?: AuthUser;
  capabilities: string[];
  isLoading: boolean;
  hasCapability(capability: string): boolean;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export const currentUserKey = ['session', 'current-user'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: currentUserKey,
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
  });
  useEffect(() => {
    clearLegacySession();
  }, []);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('gedpro.session');
    channel.onmessage = (event) => {
      if (event.data === 'logout') {
        queryClient.clear();
        router.replace('/login?reason=expired');
      }
    };
    return () => channel.close();
  }, [queryClient, router]);
  const signIn = useCallback(
    async (email: string, password: string) => {
      const value: AuthSession = await loginRequest(email, password);
      queryClient.setQueryData(currentUserKey, {
        user: value.user,
        capabilities: value.capabilities,
      });
      return value.user;
    },
    [queryClient],
  );
  const signOut = useCallback(async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST' }).catch(
      () => undefined,
    );
    queryClient.clear();
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('gedpro.session');
      channel.postMessage('logout');
      channel.close();
    }
    router.replace('/login');
    router.refresh();
  }, [queryClient, router]);
  const value = useMemo(() => {
    const capabilities = session.data?.capabilities ?? [];
    return {
      user: session.data?.user,
      capabilities,
      isLoading: session.isPending,
      hasCapability: (capability: string) => capabilities.includes(capability),
      signIn,
      signOut,
    };
  }, [session.data, session.isPending, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
