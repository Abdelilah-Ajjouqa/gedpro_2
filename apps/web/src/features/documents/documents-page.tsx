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
import { documentKeys, listDocuments } from './api';
import type { DocumentListItem, DocumentListParams } from './types';
import { decodeDocumentList, encodeDocumentList } from './url-state';

const categoryLabels = {
  resume: 'Resume',
  cover_letter: 'Cover letter',
  portfolio: 'Portfolio',
  offer: 'Offer',
  other: 'Other',
};
function size(bytes: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'unit',
    unit: 'byte',
    notation: 'compact',
  }).format(bytes);
}
export function DocumentsPage() {
  const router = useRouter(),
    pathname = usePathname(),
    search = useSearchParams();
  const { user } = useAuth();
  const params = useMemo(
    () => decodeDocumentList(new URLSearchParams(search.toString())),
    [search],
  );
  const [text, setText] = useState(params.q);
  const scope = getApiScope(user?.id);
  const query = useQuery({
    queryKey: documentKeys.list(scope, params),
    queryFn: ({ signal }) => listDocuments(params, signal),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const setParams = (next: Partial<DocumentListParams>, reset = false) => {
    const value = {
      ...params,
      ...next,
      page: reset ? 1 : (next.page ?? params.page),
    };
    const encoded = encodeDocumentList(value);
    router.replace(encoded ? `${pathname}?${encoded}` : pathname);
  };
  const columns = [
    {
      id: 'name',
      header: 'Document',
      sortable: true,
      cell: (doc: DocumentListItem) => (
        <>
          <span className="font-medium">{doc.originalName}</span>
          <span className="block text-xs text-muted-foreground">
            {doc.mimeType} · {size(doc.size)}
          </span>
        </>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      sortable: true,
      cell: (doc: DocumentListItem) => categoryLabels[doc.category],
    },
    {
      id: 'context',
      header: 'Context',
      cell: (doc: DocumentListItem) =>
        doc.application ? (
          <Link
            className="underline"
            href={`/applications/${doc.application.id}`}
          >
            Application #{doc.application.id}
          </Link>
        ) : doc.candidate ? (
          <Link className="underline" href={`/candidates/${doc.candidate.id}`}>
            Candidate #{doc.candidate.id}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'status',
      header: 'Version',
      sortable: true,
      cell: (doc: DocumentListItem) => (
        <>
          {`v${doc.version}`}
          <span className="ml-2 rounded-full border px-2 py-0.5 text-xs capitalize">
            {doc.status}
          </span>
        </>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: (doc: DocumentListItem) => (
        <time dateTime={doc.createdAt}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
            new Date(doc.createdAt),
          )}
        </time>
      ),
    },
  ];
  return (
    <PageShell>
      <PageHeader
        title="Documents"
        description="Search authorized recruitment documents."
      />
      <form
        className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setParams({ q: text }, true);
        }}
      >
        <label className="grid flex-1 gap-1 text-sm">
          <span>Search documents</span>
          <input
            className="h-9 rounded-md border bg-background px-3"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Status</span>
          <select
            className="h-9 rounded-md border bg-background px-3"
            value={params.status}
            onChange={(event) =>
              setParams(
                { status: event.target.value as DocumentListParams['status'] },
                true,
              )
            }
          >
            <option value="active">Active</option>
            <option value="archived">Archived history</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Category</span>
          <select
            className="h-9 rounded-md border bg-background px-3"
            value={params.category ?? ''}
            onChange={(event) =>
              setParams(
                {
                  category: (event.target.value ||
                    undefined) as DocumentListParams['category'],
                },
                true,
              )
            }
          >
            <option value="">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className={buttonVariants()} type="submit">
          Search
        </button>
      </form>
      {query.isPending ? (
        <LoadingState label="Loading documents" />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          title="Documents could not be loaded"
          description="Try again when the service is available."
          action={{ label: 'Retry', onClick: () => void query.refetch() }}
        />
      ) : (
        <div className="space-y-4" aria-busy={query.isFetching}>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <DataTable
              rows={query.data.data}
              columns={columns}
              rowKey={(doc) => doc.id}
              sort={{
                id: params.sort,
                direction: params.direction.toUpperCase() as 'ASC' | 'DESC',
              }}
              onSort={(id) =>
                setParams(
                  {
                    sort: id as DocumentListParams['sort'],
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
                    params.q || params.category || params.status === 'archived'
                      ? 'No matching documents'
                      : 'No documents yet'
                  }
                  description="Change or clear the filters to broaden the search."
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
