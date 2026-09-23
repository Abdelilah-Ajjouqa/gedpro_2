'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { requestEmailVerification } from '@/lib/auth';

export function CheckEmailCard() {
  const email = useSearchParams().get('email') ?? '';
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  async function resend() {
    if (!email) return;
    setPending(true);
    try {
      const result = await requestEmailVerification(email);
      setMessage(result.message);
    } catch {
      setMessage('Unable to send instructions right now. Please try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Verify your email
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Check your inbox
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        We sent verification instructions
        {email ? (
          <>
            {' '}
            to <strong className="text-foreground">{email}</strong>
          </>
        ) : null}
        . Verify your address before signing in.
      </p>
      {message ? (
        <p className="mt-5 rounded-md bg-muted px-3 py-2 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button
        className="mt-6 w-full"
        variant="outline"
        disabled={!email || pending}
        onClick={() => void resend()}
      >
        {pending ? 'Sending…' : 'Resend verification email'}
      </Button>
    </>
  );
}
