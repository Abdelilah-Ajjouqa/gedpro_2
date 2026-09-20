'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { FormField } from '@/components/auth/auth-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const registered = searchParams.get('registered') === '1';

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError(undefined);
    try { await signIn(values.email, values.password); router.replace(safeNextPath(searchParams.get('next'))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in.'); }
    finally { setPending(false); }
  }

  return <><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Sign in to GEDPro</h1><p className="mt-2 text-sm text-muted-foreground">Access your recruitment workspace and continue where you left off.</p>
    {registered ? <p className="mt-5 rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-sm text-status-success" role="status">Account created. You can now sign in.</p> : null}
    <form className="mt-7 space-y-4" onSubmit={submit}><FormField label="Email address" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} /><FormField label="Password" type="password" autoComplete="current-password" required value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
      <div className="flex justify-end"><Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">Forgot password?</Link></div>{error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}<Button className="h-11 w-full" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button></form>
    <p className="mt-6 text-center text-sm text-muted-foreground">Need a candidate account? <Link className="font-medium text-foreground hover:underline" href="/register">Create one</Link></p></>;
}
