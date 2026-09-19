'use client';

import { useQueries } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { DashboardPanels } from '@/components/dashboard-panels/dashboard-panels';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { HiringPipeline } from '@/components/pipeline/hiring-pipeline';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { getCandidates, getDashboardMetrics, getPipeline, getRecentActivity, getUpcomingInterviews, login, type DashboardFilters } from '@/lib/dashboard-api';

function LoadingState() {
  return <div className="space-y-5" aria-label="Loading dashboard"><div className="h-28 animate-pulse rounded-xl bg-muted" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div><div className="h-80 animate-pulse rounded-xl bg-muted" /></div>;
}

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string>();
  const [isSigningIn, setIsSigningIn] = useState(false);
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

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setIsSigningIn(true);
    setLoginError(undefined);
    try {
      const session = await login(credentials.email, credentials.password);
      window.localStorage.setItem('gedpro.accessToken', session.accessToken);
      await Promise.all(queries.map((query) => query.refetch()));
    } catch (reason) {
      setLoginError(reason instanceof Error ? reason.message : 'Sign in failed.');
    } finally {
      setIsSigningIn(false);
    }
  }

  if (isPending) return <LoadingState />;
  if (error instanceof ApiError && error.status === 401) return (
    <section className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm" aria-labelledby="dashboard-sign-in-heading">
      <h1 id="dashboard-sign-in-heading" className="text-xl font-semibold">Sign in to GEDPro</h1>
      <p className="mt-1 text-sm text-muted-foreground">Use your recruiter, manager, or administrator account to load the dashboard.</p>
      <form className="mt-5 space-y-4" onSubmit={signIn}>
        <label className="block text-sm font-medium">Email<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" type="email" autoComplete="email" required value={credentials.email} onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} /></label>
        <label className="block text-sm font-medium">Password<input className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" type="password" autoComplete="current-password" required value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} /></label>
        {loginError ? <p className="text-sm text-destructive" role="alert">{loginError}</p> : null}
        <Button className="w-full" type="submit" disabled={isSigningIn}>{isSigningIn ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </section>
  );
  if (error || !metrics.data || !pipeline.data || !interviews.data || !activity.data) return (
    <section className="rounded-xl border border-destructive/30 bg-card p-8 text-center" role="alert">
      <AlertCircle className="mx-auto size-8 text-destructive" /><h1 className="mt-3 text-lg font-semibold">Dashboard data is unavailable</h1>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{error instanceof Error ? error.message : 'The API returned an incomplete response.'} Sign in to the API or check the configured API URL, then try again.</p>
      <Button className="mt-4" variant="outline" onClick={() => void Promise.all(queries.map((query) => query.refetch()))}><RefreshCw className="size-4" />Try again</Button>
    </section>
  );

  return <>
    <form className="mb-5 flex max-w-md gap-2" role="search" onSubmit={applySearch}>
      <label className="relative min-w-0 flex-1"><span className="sr-only">Search candidates</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates" /></label>
      <Button type="submit" variant="outline" size="sm">Search</Button>
    </form>
    <DashboardSummary data={metrics.data} />
    <HiringPipeline stages={pipeline.data} />
    <DashboardPanels data={{ interviews: interviews.data, activity: activity.data }} />
  </>;
}
