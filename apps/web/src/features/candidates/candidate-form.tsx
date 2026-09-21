'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import type { CandidateFormValues } from './types';
const schema = z.object({
  firstName: z.string().trim().min(1, 'Enter a first name').max(100),
  lastName: z.string().trim().min(1, 'Enter a last name').max(100),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().max(40),
  tags: z.string(),
  skills: z.string(),
  source: z.string().trim().max(100),
  privacyConsent: z.boolean(),
  retentionUntil: z.string(),
});
type Values = z.infer<typeof schema>;
const fieldClass = 'h-10 rounded-md border bg-background px-3';
export function CandidateForm({
  initial,
  onSubmit,
  submitLabel = 'Save candidate',
  pending = false,
  error,
  onCancel,
}: {
  initial?: Partial<CandidateFormValues>;
  onSubmit: (values: CandidateFormValues) => void;
  submitLabel?: string;
  pending?: boolean;
  error?: string;
  onCancel: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initial?.firstName ?? '',
      lastName: initial?.lastName ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      tags: initial?.tags?.join(', ') ?? '',
      skills: initial?.skills?.join(', ') ?? '',
      source: initial?.source ?? '',
      privacyConsent: initial?.privacyConsent ?? false,
      retentionUntil: initial?.retentionUntil?.slice(0, 10) ?? '',
    },
  });
  const send = (v: Values) =>
    onSubmit({
      ...v,
      phone: v.phone || undefined,
      source: v.source || undefined,
      tags: v.tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      skills: v.skills
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      retentionUntil: v.retentionUntil || undefined,
    });
  return (
    <form
      className="space-y-6 rounded-xl border bg-card p-5"
      onSubmit={form.handleSubmit(send)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ['firstName', 'First name'],
            ['lastName', 'Last name'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['source', 'Source'],
          ] as const
        ).map(([name, label]) => (
          <label className="grid gap-1 text-sm" key={name}>
            <span>
              {label}
              {['firstName', 'lastName', 'email'].includes(name) ? ' *' : ''}
            </span>
            <input
              className={fieldClass}
              type={name === 'email' ? 'email' : 'text'}
              {...form.register(name)}
              aria-invalid={!!form.formState.errors[name]}
            />
            {form.formState.errors[name] ? (
              <span className="text-destructive" role="alert">
                {form.formState.errors[name]?.message}
              </span>
            ) : null}
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>
            Tags{' '}
            <span className="text-muted-foreground">(comma separated)</span>
          </span>
          <input className={fieldClass} {...form.register('tags')} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>
            Skills{' '}
            <span className="text-muted-foreground">(comma separated)</span>
          </span>
          <input className={fieldClass} {...form.register('skills')} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('privacyConsent')} /> Privacy
          consent recorded
        </label>
        <label className="grid gap-1 text-sm">
          <span>Retention until</span>
          <input
            className={fieldClass}
            type="date"
            {...form.register('retentionUntil')}
          />
        </label>
      </div>
      {error ? (
        <p
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={pending} type="submit">
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
