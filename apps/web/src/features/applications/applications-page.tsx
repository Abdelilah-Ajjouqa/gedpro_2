'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { buttonVariants } from '@/components/ui/button';
import { getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { DataTable } from '@/shared/components/data-table';
import { PageHeader, PageShell } from '@/shared/components/page';
import { Pagination } from '@/shared/components/pagination';
import { applicationKeys, listApplications } from './api';
import { decodeApplicationList, encodeApplicationList } from './url-state';
import type { ApplicationListParams, ApplicationSummary } from './types';

export function ApplicationsPage({ jobId }: { jobId?: number }) {
  const router = useRouter(),
    pathname = usePathname(),
    search = useSearchParams();
  const { user, hasCapability } = useAuth();
  const params = useMemo(
    () => decodeApplicationList(new URLSearchParams(search.toString()), jobId),
    [search, jobId],
  );
  const [text, setText] = useState(params.q);
  const scope = getApiScope(user?.id);
  const query = useQuery({
    queryKey: jobId
      ? applicationKeys.job(scope, jobId, params)
      : applicationKeys.list(scope, params),
    queryFn: ({ signal }) => listApplications(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    retry: false,
  });
  const setParams = (next: Partial<ApplicationListParams>, reset = false) => {
    const value = encodeApplicationList(
      { ...params, ...next, page: reset ? 1 : (next.page ?? params.page) },
      Boolean(jobId),
    );
    router.replace(value ? `${pathname}?${value}` : pathname);
  };
  const columns = [
    {
      id: 'candidate',
      header: 'Candidate',
      sortable: true,
      cell: (a: ApplicationSummary) => (
        <>
          <Link
            className="font-medium hover:underline"
            href={`/applications/${a.id}`}
          >
            {a.candidate.firstName} {a.candidate.lastName}
          </Link>
          <Link
            className="block text-xs text-muted-foreground hover:underline"
            href={`/candidates/${a.candidate.id}`}
          >
            View candidate
          </Link>
        </>
      ),
    },
    ...(!jobId
      ? [
          {
            id: 'job',
            header: 'Job',
            sortable: true,
            cell: (a: ApplicationSummary) => (
              <Link
                className="hover:underline"
                href={`/jobs/${a.job.id}/applications`}
              >
                {a.job.title}
              </Link>
            ),
          },
        ]
      : []),
    {
      id: 'stage',
      header: 'Stage',
      sortable: true,
      cell: (a: ApplicationSummary) => (
        <span className="rounded-full border px-2 py-1 text-xs">
          {a.currentStage.name}
          {a.terminal ? ' · Terminal' : ''}
        </span>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: (a: ApplicationSummary) =>
        a.owner ? `${a.owner.firstName} ${a.owner.lastName}` : 'Unassigned',
    },
    {
      id: 'source',
      header: 'Source',
      cell: (a: ApplicationSummary) => a.source || '—',
    },
    {
      id: 'createdAt',
      header: 'Opened',
      sortable: true,
      cell: (a: ApplicationSummary) => (
        <time dateTime={a.createdAt}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
            new Date(a.createdAt),
          )}
        </time>
      ),
    },
  ];
  return (
    <PageShell>
      <PageHeader
        title={jobId ? 'Job applications' : 'Applications'}
        description="Browse candidates in recruiter pipelines."
        actions={
          hasCapability('applications:create') ||
          hasCapability('applications:write') ? (
            <Link
              className={buttonVariants()}
              href={`/applications/new${jobId ? `?jobId=${jobId}` : ''}`}
            >
              Open application
            </Link>
          ) : undefined
        }
      />
      <form
        role="search"
        className="mb-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: text }, true);
        }}
      >
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span>Search applications</span>
          <input
            className="h-10 rounded-md border bg-background px-3"
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Outcome</span>
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={params.terminal}
            onChange={(e) =>
              setParams(
                {
                  terminal: e.target.value as ApplicationListParams['terminal'],
                },
                true,
              )
            }
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="terminal">Terminal</option>
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-3">
          <button className={buttonVariants()} type="submit">
            Search
          </button>
          <button
            className={buttonVariants({ variant: 'outline' })}
            type="button"
            onClick={() => {
              setText('');
              router.replace(pathname);
            }}
          >
            Clear
          </button>
        </div>
      </form>
      {query.isPending ? (
        <LoadingState label="Loading applications" />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          title="Applications could not be loaded"
          action={{ label: 'Retry', onClick: () => void query.refetch() }}
        />
      ) : (
        <div className="space-y-4" aria-busy={query.isFetching}>
          <p className="sr-only" aria-live="polite">
            {query.data.total} applications found
          </p>
          <div
            className="overflow-x-auto rounded-xl border bg-card"
            role="region"
            aria-label="Application results"
            tabIndex={0}
          >
            <DataTable
              rows={query.data.data}
              columns={columns}
              rowKey={(a) => a.id}
              empty={
                <AsyncState
                  kind="empty"
                  title="No applications found"
                  description="Open an application or change the filters."
                />
              }
            />
          </div>
          <Pagination
            page={params.page}
            limit={params.limit}
            total={query.data.total}
            onPageChange={(page) => setParams({ page })}
          />
        </div>
      )}
    </PageShell>
  );
}
