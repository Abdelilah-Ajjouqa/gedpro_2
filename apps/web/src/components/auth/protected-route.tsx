'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, pathname, router, user]);
  if (isLoading || !user) return <div className="grid min-h-dvh place-items-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" role="status"><span className="sr-only">Checking session</span></div></div>;
  if (!['admin', 'rh', 'manager'].includes(user.role)) return <main className="grid min-h-dvh place-items-center bg-background p-6"><section className="max-w-md text-center"><ShieldAlert className="mx-auto size-10 text-status-warning" /><h1 className="mt-4 text-2xl font-semibold">Recruitment workspace access required</h1><p className="mt-2 text-sm text-muted-foreground">Your candidate account is active, but this dashboard is available only to recruitment team members. Contact an administrator if your role is incorrect.</p><Button className="mt-6" variant="outline" onClick={() => void signOut()}>Sign out</Button></section></main>;
  return children;
}
