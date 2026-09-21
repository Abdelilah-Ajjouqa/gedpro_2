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
import { candidateKeys, listCandidates } from './api';
import type { CandidateListItem, CandidateListParams } from './types';
import { stateLabels } from './types';
import { decodeCandidateList, encodeCandidateList } from './url-state';
export function CandidatesPage() {
  const router = useRouter(),
    pathname = usePathname(),
    search = useSearchParams();
  const { user, hasCapability } = useAuth();
  const params = useMemo(
    () => decodeCandidateList(new URLSearchParams(search.toString())),
    [search],
  );
  const [text, setText] = useState(params.q);
  const scope = getApiScope(user?.id);
  const query = useQuery({
    queryKey: candidateKeys.list(scope, params),
    queryFn: ({ signal }) => listCandidates(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });
  const setParams = (next: Partial<CandidateListParams>, reset = false) => {
    const value = encodeCandidateList({
      ...params,
      ...next,
      page: reset ? 1 : (next.page ?? params.page),
    });
    router.replace(value ? `${pathname}?${value}` : pathname);
  };
  const filtered = Boolean(
    params.q ||
    params.tag ||
    params.skill ||
    params.source ||
    params.ownerId ||
    params.state ||
    params.disposition !== 'active',
  );
  const columns = [
    {
      id: 'name',
      header: 'Candidate',
      cell: (c: CandidateListItem) => (
        <>
          <Link
            className="font-medium hover:underline"
            href={`/candidates/${c.id}?returnTo=${encodeURIComponent(`${pathname}?${encodeCandidateList(params)}`)}`}
          >
            {c.firstName} {c.lastName}
          </Link>
          <span className="block text-xs text-muted-foreground">
            {c.email || 'Personal data erased'}
          </span>
        </>
      ),
    },
    {
      id: 'state',
      header: 'State',
      cell: (c: CandidateListItem) => (
        <span className="rounded-full border px-2 py-1 text-xs">
          {stateLabels[c.state]}
        </span>
      ),
    },
    {
      id: 'classification',
      header: 'Skills / tags',
      cell: (c: CandidateListItem) => (
        <span className="text-sm">
          {[...c.skills, ...c.tags].slice(0, 3).join(', ') || '—'}
        </span>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      cell: (c: CandidateListItem) =>
        c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : 'Unassigned',
    },
    {
      id: 'disposition',
      header: 'Disposition',
      cell: (c: CandidateListItem) => (
        <span className="capitalize">{c.disposition}</span>
      ),
    },
    {
      id: 'updatedAt',
      header: 'Updated',
      sortable: true,
      cell: (c: CandidateListItem) => (
        <time dateTime={c.updatedAt}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
            new Date(c.updatedAt),
          )}
        </time>
      ),
    },
  ];
  return (
    <PageShell>
      <PageHeader
        title="Candidates"
        description="Search and manage candidate profiles."
        actions={
          hasCapability('candidates:create') ? (
            <Link className={buttonVariants()} href="/candidates/new">
              Create candidate
            </Link>
          ) : undefined
        }
      />
      <form
        role="search"
        className="mb-5 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: text }, true);
        }}
      >
        <label className="grid gap-1 text-sm md:col-span-2">
          <span>Search candidates</span>
          <input
            className="h-10 rounded-md border bg-background px-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>State</span>
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={params.state ?? ''}
            onChange={(e) =>
              setParams(
                {
                  state: (e.target.value ||
                    undefined) as CandidateListParams['state'],
                },
                true,
              )
            }
          >
            <option value="">All states</option>
            {Object.entries(stateLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Disposition</span>
          <select
            className="h-10 rounded-md border bg-background px-3"
            value={params.disposition}
            onChange={(e) =>
              setParams(
                {
                  disposition: e.target
                    .value as CandidateListParams['disposition'],
                },
                true,
              )
            }
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">Active and archived</option>
          </select>
        </label>
        <div className="flex gap-2 md:col-span-4">
          <button className={buttonVariants()} type="submit">
            Search
          </button>
          {filtered ? (
            <button
              type="button"
              className={buttonVariants({ variant: 'outline' })}
              onClick={() => {
                setText('');
                router.replace(pathname);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </form>
      {query.isPending ? (
        <LoadingState label="Loading candidates" />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          title="Candidates could not be loaded"
          description="Try again when the service is available."
          action={{ label: 'Retry', onClick: () => void query.refetch() }}
        />
      ) : (
        <div className="space-y-4" aria-busy={query.isFetching}>
          <p className="sr-only" aria-live="polite">
            {query.data.total} candidates found
          </p>
          <div
            className="overflow-x-auto rounded-xl border bg-card"
            role="region"
            aria-label="Candidate results"
            tabIndex={0}
          >
            <DataTable
              rows={query.data.data}
              columns={columns}
              rowKey={(c) => c.id}
              sort={{
                id: params.sort,
                direction: params.direction.toUpperCase() as 'ASC' | 'DESC',
              }}
              onSort={(id) =>
                setParams(
                  {
                    sort: id as CandidateListParams['sort'],
                    direction:
                      params.sort === id && params.direction === 'asc'
                        ? 'desc'
                        : 'asc',
                  },
                  true,
                )
              }
              empty={
                <AsyncState
                  kind="empty"
                  title={
                    filtered ? 'No matching candidates' : 'No candidates yet'
                  }
                  description={
                    filtered
                      ? 'Change or clear the filters.'
                      : 'Create the first candidate when you are ready.'
                  }
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
