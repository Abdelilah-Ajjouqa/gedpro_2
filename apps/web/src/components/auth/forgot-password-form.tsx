'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { FormField } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { requestPasswordReset } from '@/lib/auth';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to submit the request.',
      );
    } finally {
      setPending(false);
    }
  }
  if (sent)
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-10 text-status-success" />
        <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for {email}, password reset instructions have
          been sent.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Account recovery
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Forgot your password?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your account email and we’ll send reset instructions.
      </p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="h-11 w-full" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <Link
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium hover:underline"
        href="/login"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </>
  );
}
