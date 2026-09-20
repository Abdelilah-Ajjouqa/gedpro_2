'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { FormField } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { resetPassword } from '@/lib/auth';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? ''; const [values, setValues] = useState({ password: '', confirmPassword: '' }); const [error, setError] = useState<string>(); const [complete, setComplete] = useState(false); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); setError(undefined); if (!token) { setError('This reset link is missing its token.'); setPending(false); return; } if (values.password !== values.confirmPassword) { setError('Passwords do not match.'); setPending(false); return; } try { await resetPassword({ token, ...values }); setComplete(true); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reset the password.'); } finally { setPending(false); } }
  if (complete) return <div className="text-center"><h1 className="text-2xl font-semibold">Password updated</h1><p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p><Button asChild className="mt-6"><Link href="/login">Continue to sign in</Link></Button></div>;
  return <><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Account recovery</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Set a new password</h1><p className="mt-2 text-sm text-muted-foreground">Use at least 12 characters for your new password.</p><form className="mt-7 space-y-4" onSubmit={submit}><FormField label="New password" type="password" autoComplete="new-password" minLength={12} required value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} /><FormField label="Confirm new password" type="password" autoComplete="new-password" minLength={12} required value={values.confirmPassword} onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))} />{error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}<Button className="h-11 w-full" type="submit" disabled={pending}>{pending ? 'Updating…' : 'Update password'}</Button></form></>;
}
