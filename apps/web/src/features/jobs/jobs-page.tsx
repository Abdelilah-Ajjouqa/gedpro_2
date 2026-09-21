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
import { jobKeys, listJobs } from './api';
import type { JobListItem, JobListParams } from './types';
import { decodeJobList, encodeJobList } from './url-state';

const labels = { draft: 'Draft', published: 'Published', closed: 'Closed', archived: 'Archived' };
export function JobsPage() {
  const router = useRouter(); const pathname = usePathname(); const search = useSearchParams(); const { user, hasCapability } = useAuth();
  const params = useMemo(() => decodeJobList(new URLSearchParams(search.toString())), [search]);
  const [searchText, setSearchText] = useState(params.q);
  const scope = getApiScope(user?.id);
  const query = useQuery({ queryKey: jobKeys.list(scope, params), queryFn: ({ signal }) => listJobs(params, signal), staleTime: 30_000, placeholderData: keepPreviousData, retry: false });
  const setParams = (next: Partial<JobListParams>, resetPage = false) => router.replace(`${pathname}?${encodeJobList({ ...params, ...next, page: resetPage ? 1 : next.page ?? params.page })}`);
  const columns = [
    { id: 'title', header: 'Title', sortable: true, cell: (job: JobListItem) => <Link className="font-medium hover:underline" href={`/jobs/${job.id}`}>{job.title}</Link> },
    { id: 'status', header: 'Status', sortable: true, cell: (job: JobListItem) => <span className="rounded-full border px-2 py-1 text-xs font-medium">{labels[job.status]}</span> },
    { id: 'owner', header: 'Owner', cell: (job: JobListItem) => `${job.owner.firstName} ${job.owner.lastName}` },
    { id: 'department', header: 'Department / location', cell: (job: JobListItem) => <><span>{job.department || '—'}</span><span className="block text-xs text-muted-foreground">{job.location || 'No location'}</span></> },
    { id: 'pipeline', header: 'Pipeline', cell: (job: JobListItem) => job.pipeline.name },
    { id: 'updatedAt', header: 'Updated', sortable: true, cell: (job: JobListItem) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(job.updatedAt)) },
  ];
  return <PageShell>
    <PageHeader title="Jobs" description="Search and manage job openings." actions={hasCapability('jobs:create') ? <Link className={buttonVariants()} href="/jobs/new">Create job</Link> : undefined} />
    <form className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); setParams({ q: searchText }, true); }} role="search">
      <label className="grid flex-1 gap-1 text-sm"><span>Search jobs</span><input className="h-9 rounded-md border bg-background px-3" value={searchText} onChange={(event) => setSearchText(event.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span>Status</span><select className="h-9 rounded-md border bg-background px-3" value={params.status ?? ''} onChange={(event) => setParams({ status: (event.target.value || undefined) as JobListParams['status'] }, true)}><option value="">All active statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
      <label className="grid gap-1 text-sm"><span>Sort</span><select className="h-9 rounded-md border bg-background px-3" value={`${params.sort}:${params.direction}`} onChange={(event) => { const [sort, direction] = event.target.value.split(':') as [JobListParams['sort'], JobListParams['direction']]; setParams({ sort, direction }, true); }}><option value="createdAt:desc">Newest</option><option value="updatedAt:desc">Recently updated</option><option value="title:asc">Title A–Z</option><option value="status:asc">Status</option></select></label>
      <button className={buttonVariants()} type="submit">Search</button>
    </form>
    {query.isPending ? <LoadingState label="Loading jobs" /> : query.isError ? <AsyncState kind="error" title="Jobs could not be loaded" description="Try again when the service is available." action={{ label: 'Retry', onClick: () => void query.refetch() }} /> : <div className="space-y-4" aria-busy={query.isFetching}><div className="rounded-xl border bg-card"><DataTable rows={query.data.data} columns={columns} rowKey={(job) => job.id} sort={{ id: params.sort, direction: params.direction.toUpperCase() as 'ASC' | 'DESC' }} onSort={(id) => setParams({ sort: id as JobListParams['sort'], direction: params.sort === id && params.direction === 'asc' ? 'desc' : 'asc' }, true)} empty={<AsyncState kind={params.q || params.status ? 'empty' : 'empty'} title={params.q || params.status ? 'No matching jobs' : 'No jobs yet'} description={params.q || params.status ? 'Change or clear the filters.' : 'Create the first draft job when you are ready.'} />} /></div><Pagination page={params.page} limit={params.limit} total={query.data.total} onPageChange={(page) => setParams({ page })} /></div>}
  </PageShell>;
}
