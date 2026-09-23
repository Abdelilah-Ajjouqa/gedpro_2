'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, PageShell } from '@/shared/components/page';
import { createTemplate } from './api';
import type { Criterion } from './types';
const blank = (): Criterion => ({
  key: '',
  label: '',
  description: '',
  minRating: 1,
  maxRating: 5,
  required: true,
});
export function TemplateCreatePage() {
  const router = useRouter(),
    [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [criteria, setCriteria] = useState<Criterion[]>([blank()]),
    [error, setError] = useState('');
  const m = useMutation({
    mutationFn: () =>
      createTemplate({ name, description: description || undefined, criteria }),
    onSuccess: () => router.push('/settings/scorecard-templates'),
    onError: (e) =>
      setError(
        e instanceof Error ? e.message : 'Template could not be created.',
      ),
  });
  const change = (i: number, v: Partial<Criterion>) =>
    setCriteria(criteria.map((c, n) => (n === i ? { ...c, ...v } : c)));
  return (
    <PageShell>
      <PageHeader
        title="Create scorecard template"
        description="Criteria are snapshotted when assigned and cannot be edited here later."
      />
      <form
        className="mx-auto grid max-w-3xl gap-4 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
      >
        <label className="grid gap-1">
          <span>Name</span>
          <input
            required
            maxLength={200}
            className="h-10 rounded-md border bg-background px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span>Description</span>
          <textarea
            maxLength={2000}
            className="rounded-md border bg-background p-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <h2 className="text-lg font-semibold">Criteria</h2>
        {criteria.map((c, i) => (
          <fieldset
            className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
            key={i}
          >
            <legend className="px-1">Criterion {i + 1}</legend>
            <label className="grid gap-1">
              <span>Stable key</span>
              <input
                required
                maxLength={80}
                pattern="[A-Za-z0-9_-]+"
                className="h-10 rounded-md border bg-background px-3"
                value={c.key}
                onChange={(e) => change(i, { key: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span>Label</span>
              <input
                required
                maxLength={200}
                className="h-10 rounded-md border bg-background px-3"
                value={c.label}
                onChange={(e) => change(i, { label: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span>Minimum</span>
              <input
                required
                type="number"
                className="h-10 rounded-md border bg-background px-3"
                value={c.minRating}
                onChange={(e) =>
                  change(i, { minRating: Number(e.target.value) })
                }
              />
            </label>
            <label className="grid gap-1">
              <span>Maximum</span>
              <input
                required
                type="number"
                className="h-10 rounded-md border bg-background px-3"
                value={c.maxRating}
                onChange={(e) =>
                  change(i, { maxRating: Number(e.target.value) })
                }
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={i === 0}
                onClick={() =>
                  setCriteria(
                    criteria.map((x, n) =>
                      n === i - 1 ? criteria[i] : n === i ? criteria[i - 1] : x,
                    ),
                  )
                }
              >
                Move up
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={i === criteria.length - 1}
                onClick={() =>
                  setCriteria(
                    criteria.map((x, n) =>
                      n === i + 1 ? criteria[i] : n === i ? criteria[i + 1] : x,
                    ),
                  )
                }
              >
                Move down
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={criteria.length === 1}
                onClick={() => setCriteria(criteria.filter((_, n) => n !== i))}
              >
                Remove
              </Button>
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setCriteria([...criteria, blank()])}
        >
          Add criterion
        </Button>
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Button disabled={m.isPending}>Create template</Button>
      </form>
    </PageShell>
  );
}
