'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormField } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { register } from '@/lib/auth';

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      setPending(false);
      return;
    }
    try {
      await register(values);
      router.replace(`/check-email?email=${encodeURIComponent(values.email)}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to create the account.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        Candidate access
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Register a candidate account. Recruitment team roles are provisioned by
        an administrator.
      </p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            autoComplete="given-name"
            minLength={2}
            required
            value={values.firstName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
          />
          <FormField
            label="Last name"
            autoComplete="family-name"
            minLength={2}
            required
            value={values.lastName}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
          />
        </div>
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          value={values.confirmPassword}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              confirmPassword: event.target.value,
            }))
          }
        />
        {error ? (
          <p
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button className="h-11 w-full" type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link
          className="font-medium text-foreground hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
