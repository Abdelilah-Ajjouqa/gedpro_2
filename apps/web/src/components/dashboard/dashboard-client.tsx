'use client';

import { useQueries } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { DashboardPanels } from '@/components/dashboard-panels/dashboard-panels';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { HiringPipeline } from '@/components/pipeline/hiring-pipeline';
import { Button } from '@/components/ui/button';
import { getApiScope } from '@/lib/api-client';
import { getCandidates, getDashboardMetrics, getPipeline, getRecentActivity, getUpcomingInterviews, type DashboardFilters } from '@/lib/dashboard-api';

function LoadingState() {
  return <div className="space-y-5" aria-busy="true" aria-live="polite" role="status"><span className="sr-only">Loading dashboard data</span><div aria-hidden="true" className="h-28 animate-pulse rounded-xl bg-muted" /><div aria-hidden="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div><div aria-hidden="true" className="h-80 animate-pulse rounded-xl bg-muted" /></div>;
}

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const filters = useMemo<DashboardFilters>(() => ({
    jobId: Number(searchParams.get('jobId')) || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sortBy') as DashboardFilters['sortBy']) || 'createdAt',
    sortOrder: searchParams.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50)),
  }), [searchParams]);
  const scope = getApiScope();
  const queries = useQueries({ queries: [
    { queryKey: ['dashboard-metrics', { ...filters, scope }], queryFn: ({ signal }) => getDashboardMetrics(filters, signal), staleTime: 45_000 },
    { queryKey: ['pipeline', filters.jobId, { ...filters, scope }], queryFn: ({ signal }) => getPipeline(filters, signal), staleTime: 20_000 },
    { queryKey: ['candidates', { ...filters, scope }], queryFn: ({ signal }) => getCandidates(filters, signal), staleTime: 60_000 },
    { queryKey: ['upcoming-interviews', { ...filters, scope }], queryFn: ({ signal }) => getUpcomingInterviews(filters, signal), staleTime: 45_000 },
    { queryKey: ['recent-activity', { ...filters, scope }], queryFn: ({ signal }) => getRecentActivity(filters, signal), staleTime: 20_000 },
  ] });
  const [metrics, pipeline, , interviews, activity] = queries;
  const isPending = queries.some((query) => query.isPending);
  const error = queries.find((query) => query.error)?.error;

  function applySearch(event: React.FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    if (search) next.set('search', search);
    else next.delete('search');
    next.set('page', '1');
    router.replace(`/?${next.toString()}`);
  }

  if (isPending) return <LoadingState />;
  if (error || !metrics.data || !pipeline.data || !interviews.data || !activity.data) return (
    <section className="rounded-xl border border-destructive/30 bg-card p-8 text-center" role="alert">
      <AlertCircle className="mx-auto size-8 text-destructive" /><h1 className="mt-3 text-lg font-semibold">Dashboard data is unavailable</h1>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{error instanceof Error ? error.message : 'The API returned an incomplete response.'} Sign in to the API or check the configured API URL, then try again.</p>
      <Button className="mt-4" variant="outline" disabled={queries.some((query) => query.isFetching)} onClick={() => void Promise.all(queries.map((query) => query.refetch()))}><RefreshCw className="size-4" aria-hidden="true" />Try again</Button>
    </section>
  );

  return <>
    <form className="mb-5 flex max-w-md gap-2" role="search" onSubmit={applySearch}>
      <label className="relative min-w-0 flex-1"><span className="sr-only">Search candidates</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input id="candidate-search" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates" /></label>
      <Button type="submit" variant="outline" size="sm">Search</Button>
    </form>
    <DashboardSummary data={metrics.data} />
    <HiringPipeline stages={pipeline.data} />
    <DashboardPanels data={{ interviews: interviews.data, activity: activity.data }} />
  </>;
}
