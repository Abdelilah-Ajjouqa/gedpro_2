'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { PageHeader, PageShell } from '@/shared/components/page';
import { listTemplates } from './api';
export function TemplatesPage() {
  const q = useQuery({
    queryKey: ['scorecard-templates'],
    queryFn: ({ signal }) => listTemplates(signal),
    staleTime: 60_000,
    retry: false,
  });
  return (
    <PageShell>
      <PageHeader
        title="Scorecard templates"
        description="Reusable, immutable structured feedback criteria."
        actions={
          <Link
            className={buttonVariants()}
            href="/settings/scorecard-templates/new"
          >
            Create template
          </Link>
        }
      />
      {q.isPending ? (
        <LoadingState label="Loading templates" />
      ) : q.isError ? (
        <AsyncState kind="error" title="Templates could not be loaded" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {q.data.map((t) => (
            <li className="p-4" key={t.id}>
              <h2 className="font-semibold">{t.name}</h2>
              <p className="text-sm text-muted-foreground">
                {t.criteria.length} criteria · {t.job?.title ?? 'Global scope'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
