'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { buttonVariants } from '@/components/ui/button';
import { getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { DataTable } from '@/shared/components/data-table';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { Pagination } from '@/shared/components/pagination';
import { listPipelines, pipelineKeys, type PipelineModel } from './api';
export function PipelinesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, hasCapability } = useAuth();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search')?.trim() ?? '';
  const [text, setText] = useState(search);
  const params = { page, limit: 20, search };
  const query = useQuery({
    queryKey: pipelineKeys.list(getApiScope(user?.id), params),
    queryFn: ({ signal }) => listPipelines(params, signal),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const navigate = (next: { page?: number; search?: string }) => {
    const q = new URLSearchParams();
    const value = next.search ?? search;
    const nextPage = next.page ?? page;
    if (value) q.set('search', value);
    if (nextPage > 1) q.set('page', String(nextPage));
    router.replace(`/settings/pipelines?${q}`);
  };
  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (p: PipelineModel) => (
        <Link
          className="font-medium hover:underline"
          href={`/settings/pipelines/${p.id}`}
        >
          {p.name}
        </Link>
      ),
    },
    {
      id: 'stages',
      header: 'Stages',
      cell: (p: PipelineModel) => p.stages.filter((s) => !s.archived).length,
    },
    {
      id: 'readiness',
      header: 'Readiness',
      cell: (p: PipelineModel) =>
        p.readiness?.ready
          ? 'Ready'
          : p.readiness
            ? `${p.readiness.issues.length} blocker(s)`
            : 'Not checked',
    },
    {
      id: 'usage',
      header: 'Usage',
      cell: (p: PipelineModel) => `${p.jobCount ?? 0} jobs`,
    },
    {
      id: 'updated',
      header: 'Updated',
      cell: (p: PipelineModel) =>
        new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
          new Date(p.updatedAt),
        ),
    },
  ];
  return (
    <PageShell>
      <Breadcrumbs items={[{ label: 'Settings' }, { label: 'Pipelines' }]} />
      <PageHeader
        title="Hiring pipelines"
        description="Configure reusable stages and transition rules."
        actions={
          hasCapability('pipelines:configure') ? (
            <Link className={buttonVariants()} href="/settings/pipelines/new">
              Create pipeline
            </Link>
          ) : undefined
        }
      />
      <form
        role="search"
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: text, page: 1 });
        }}
      >
        <label className="grid flex-1 gap-1 text-sm">
          <span>Search pipelines</span>
          <input
            className="h-9 rounded-md border bg-background px-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <button className={buttonVariants()} type="submit">
          Search
        </button>
      </form>
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          title="Pipelines could not be loaded"
          action={{ label: 'Retry', onClick: () => void query.refetch() }}
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card">
            <DataTable
              rows={query.data.data}
              columns={columns}
              rowKey={(p) => p.id}
              empty={
                <AsyncState
                  kind="empty"
                  title={search ? 'No matching pipelines' : 'No pipelines yet'}
                />
              }
            />
          </div>
          <Pagination
            page={page}
            limit={20}
            total={query.data.total}
            onPageChange={(value) => navigate({ page: value })}
          />
        </div>
      )}
    </PageShell>
  );
}
