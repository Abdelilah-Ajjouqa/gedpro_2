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
import {
  parseSessionEvent,
  parseStoredSessionEvent,
  publishSessionEvent,
  SESSION_CHANNEL,
  SESSION_STORAGE_KEY,
  type SessionEvent,
} from '@/shared/auth/session-events';

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
    const applyEvent = (event: SessionEvent) => {
      queryClient.clear();
      if (event === 'changed') {
        void queryClient.invalidateQueries({ queryKey: currentUserKey });
        return;
      }
      router.replace(event === 'expired' ? '/login?reason=expired' : '/login');
    };
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? undefined
        : new BroadcastChannel(SESSION_CHANNEL);
    if (channel)
      channel.onmessage = (message) => {
        const event = parseSessionEvent(message.data);
        if (event) applyEvent(event);
      };
    const onStorage = (storage: StorageEvent) => {
      if (storage.key !== SESSION_STORAGE_KEY) return;
      const event = parseStoredSessionEvent(storage.newValue);
      if (event) applyEvent(event);
    };
    const onExpired = () => applyEvent('expired');
    window.addEventListener('storage', onStorage);
    window.addEventListener('gedpro:session-expired', onExpired);
    return () => {
      channel?.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gedpro:session-expired', onExpired);
    };
  }, [queryClient, router]);
  const signIn = useCallback(
    async (email: string, password: string) => {
      const value: AuthSession = await loginRequest(email, password);
      queryClient.setQueryData(currentUserKey, {
        user: value.user,
        capabilities: value.capabilities,
      });
      publishSessionEvent('changed');
      return value.user;
    },
    [queryClient],
  );
  const signOut = useCallback(async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST' }).catch(
      () => undefined,
    );
    queryClient.clear();
    publishSessionEvent('logout');
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
