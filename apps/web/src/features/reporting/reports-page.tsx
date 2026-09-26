'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { DataTable, type Column } from '@/shared/components/data-table';
import { PageHeader, PageShell } from '@/shared/components/page';
import { createReportExport, downloadReportExport, getReportSummary, listReportExports, listReportJobs, reportingKeys } from './api';
import { decodeReportFilters, defaultReportFilters, encodeReportFilters } from './url-state';
import type { ReportExportFormat, ReportExportListItem, ReportFilters } from './types';

const number = new Intl.NumberFormat();
const utc = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value));
const day = (value?: string) => value ? value.slice(0, 10) : '';
const isoDay = (value: string, end = false) => { const date = new Date(`${value}T00:00:00.000Z`); if (end) date.setUTCDate(date.getUTCDate() + 1); return date.toISOString(); };
const duration = (value: number | null) => value == null ? 'Not available' : `${number.format(value)} hours`;

function Metric<T>({ id, title, note, rows, columns }: { id: string; title: string; note: string; rows: T[]; columns: Column<T>[] }) {
  return <section id={id} className="rounded-xl border bg-card p-4 scroll-mt-6" aria-labelledby={`${id}-title`}><h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2><p className="mb-3 text-sm text-muted-foreground">{note}</p><DataTable rows={rows} columns={columns} rowKey={(_, index?: number) => index ?? 0} empty={<p className="py-6 text-sm text-muted-foreground">No data in this UTC interval.</p>} /></section>;
}

function ExportHistory({ rows, onRefresh }: { rows: ReportExportListItem[]; onRefresh(): void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth(); const scope = getApiScope(user?.id);
  const active = rows.some((row) => row.status === 'pending' || row.status === 'processing');
  useEffect(() => { if (!active) return; const timer = window.setInterval(() => void queryClient.invalidateQueries({ queryKey: reportingKeys.exports(scope) }), 7_500); return () => window.clearInterval(timer); }, [active, queryClient, scope]);
  const columns: Column<ReportExportListItem>[] = [
    { id: 'format', header: 'Format', cell: (row) => row.format.toUpperCase() },
    { id: 'status', header: 'Status', cell: (row) => <span className="capitalize">{row.status}</span> },
    { id: 'filters', header: 'Scope', cell: (row) => row.filters.jobId ? `Job #${row.filters.jobId}` : 'All authorized jobs' },
    { id: 'created', header: 'Requested (UTC)', cell: (row) => <time dateTime={row.createdAt}>{utc(row.createdAt)}</time> },
    { id: 'expires', header: 'Expires (UTC)', cell: (row) => <time dateTime={row.expiresAt}>{utc(row.expiresAt)}</time> },
    { id: 'action', header: 'Download', cell: (row) => row.status === 'completed' ? <Button size="sm" variant="outline" onClick={() => void downloadReportExport(row.id).catch(() => onRefresh())}><Download className="size-4" aria-hidden="true" /> Download</Button> : <span className="text-muted-foreground">{row.status === 'failed' ? 'Create a new export' : row.status === 'expired' ? 'Expired' : 'Preparing'}</span> },
  ];
  return <section className="rounded-xl border bg-card p-4" aria-labelledby="export-history"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 id="export-history" className="text-lg font-semibold">Export history</h2><p className="text-sm text-muted-foreground">Aggregate-only exports expire after 24 hours.</p></div><Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="size-4" aria-hidden="true" /> Refresh</Button></div><DataTable rows={rows} columns={columns} rowKey={(row) => row.id} empty={<p className="py-6 text-sm text-muted-foreground">No exports yet.</p>} /></section>;
}

export function ReportsPage() {
  const router = useRouter(); const pathname = usePathname(); const search = useSearchParams(); const { user, hasCapability } = useAuth(); const scope = getApiScope(user?.id);
  const filters = useMemo(() => ({ ...defaultReportFilters(), ...decodeReportFilters(new URLSearchParams(search.toString())) }), [search]);
  const [from, setFrom] = useState(day(filters.from)); const [to, setTo] = useState(day(filters.to)); const [jobId, setJobId] = useState(String(filters.jobId ?? '')); const [format, setFormat] = useState<ReportExportFormat>('xlsx');
  const summary = useQuery({ queryKey: reportingKeys.summary(scope, filters), queryFn: ({ signal }) => getReportSummary(filters, signal), staleTime: 45_000, placeholderData: keepPreviousData, retry: false });
  const jobs = useQuery({ queryKey: reportingKeys.jobs(scope), queryFn: ({ signal }) => listReportJobs(signal), staleTime: 60_000, retry: false });
  const exports = useQuery({ queryKey: reportingKeys.exports(scope), queryFn: ({ signal }) => listReportExports(signal), staleTime: 20_000, retry: false });
  const queryClient = useQueryClient(); const create = useMutation({ mutationFn: () => createReportExport(filters, format), onSuccess: () => void queryClient.invalidateQueries({ queryKey: reportingKeys.exports(scope) }) });
  const apply = (event: React.FormEvent) => { event.preventDefault(); if (!from || !to || new Date(from) >= new Date(to)) return; const next: ReportFilters = { from: isoDay(from), to: isoDay(to, true), jobId: jobId ? Number(jobId) : undefined }; router.replace(`${pathname}?${encodeReportFilters(next)}`); };
  const data = summary.data;
  return <PageShell>
    <PageHeader title="Reports" description="Aggregate hiring metrics and scoped exports." actions={hasCapability('reports:export:create') ? <div className="flex gap-2"><select aria-label="Export format" className="h-9 rounded-md border bg-background px-2" value={format} onChange={(e) => setFormat(e.target.value as ReportExportFormat)}><option value="xlsx">XLSX</option><option value="csv">CSV</option></select><Button disabled={create.isPending} onClick={() => create.mutate()}>Export {format.toUpperCase()}</Button></div> : undefined} />
    <form className="mb-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4" onSubmit={apply} aria-label="Report filters"><label className="grid gap-1 text-sm">From (UTC)<input required type="date" max={to} className="h-9 rounded-md border bg-background px-2" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label className="grid gap-1 text-sm">To, inclusive (UTC)<input required type="date" min={from} className="h-9 rounded-md border bg-background px-2" value={to} onChange={(e) => setTo(e.target.value)} /></label><label className="grid gap-1 text-sm">Job<select className="h-9 rounded-md border bg-background px-2" value={jobId} onChange={(e) => setJobId(e.target.value)}><option value="">All authorized jobs</option>{jobs.data?.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><div className="flex items-end gap-2"><button className={buttonVariants()} type="submit">Apply</button><Button type="button" variant="outline" onClick={() => router.replace(pathname)}>Clear</Button></div><p className="sm:col-span-4 text-xs text-muted-foreground">Dates use UTC. The selected end day is included; requests use a half-open [from, to) interval.</p></form>
    {summary.isPending ? <LoadingState label="Loading report" /> : summary.isError || !data ? <AsyncState kind="error" title="Report could not be loaded" description="Check the selected interval and authorized job, then try again." action={{ label: 'Retry', onClick: () => void summary.refetch() }} /> : <div className="space-y-4" aria-busy={summary.isFetching}><p className="rounded-md bg-muted px-3 py-2 text-sm">Reporting interval: <time dateTime={data.boundaries.from}>{utc(data.boundaries.from)}</time> to <time dateTime={data.boundaries.toExclusive}>{utc(data.boundaries.toExclusive)}</time> (exclusive).</p><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Totals"><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Applications created</p><p className="text-2xl font-semibold">{number.format(data.totals.applications)}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Current hires among applications created</p><p className="text-2xl font-semibold">{number.format(data.totals.hired)}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">First review</p><p className="text-lg font-semibold">{duration(data.totals.avgHoursToFirstReview)}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Time to hire</p><p className="text-lg font-semibold">{data.totals.avgDaysToHire == null ? 'Not available' : `${number.format(data.totals.avgDaysToHire)} days`}</p></div></section>
    <Metric id="funnel" title="Funnel" note="Stage-history entries in this interval. Share is relative to the first ordered stage." rows={data.funnel} columns={[{ id: 'stage', header: 'Stage', cell: (r) => r.name }, { id: 'count', header: 'Entries', cell: (r) => number.format(r.count) }, { id: 'share', header: 'Share of first-stage entries', cell: (r) => `${(r.conversionFromFirstStage * 100).toFixed(1)}%` }]} />
    <Metric id="stage-time" title="Time in stage" note="Average duration for stage visits entered in this interval; active visits end at report execution." rows={data.timeInStage} columns={[{ id: 'stage', header: 'Stage', cell: (r) => r.name }, { id: 'hours', header: 'Average', cell: (r) => duration(r.avgHours) }]} />
    <Metric id="rejections" title="Rejection reasons" note="Current rejected state among applications created in this interval." rows={data.rejectionReasons} columns={[{ id: 'reason', header: 'Reason', cell: (r) => r.reason }, { id: 'count', header: 'Applications', cell: (r) => number.format(r.count) }]} />
    <Metric id="sources" title="Sources" note="Current outcomes among applications created in this interval." rows={data.sources} columns={[{ id: 'source', header: 'Source', cell: (r) => r.source }, { id: 'applications', header: 'Applications', cell: (r) => number.format(r.applications) }, { id: 'hired', header: 'Hired', cell: (r) => number.format(r.hired) }]} />
    <Metric id="recruiters" title="Recruiter workload" note="Applications created in this interval." rows={data.recruiters} columns={[{ id: 'name', header: 'Recruiter', cell: (r) => r.recruiter }, { id: 'applications', header: 'Applications', cell: (r) => number.format(r.applications) }]} />
    <Metric id="interviewers" title="Interviewer workload" note="Interviews scheduled in this interval." rows={data.interviewers} columns={[{ id: 'name', header: 'Interviewer', cell: (r) => r.interviewer }, { id: 'interviews', header: 'Interviews', cell: (r) => number.format(r.interviews) }, { id: 'pending', header: 'Pending scorecards', cell: (r) => number.format(r.pendingScorecards) }]} />
    <Metric id="jobs" title="Job performance" note="Current outcomes among applications created in this interval." rows={data.jobs} columns={[{ id: 'title', header: 'Job', cell: (r) => r.title }, { id: 'applications', header: 'Applications', cell: (r) => number.format(r.applications) }, { id: 'hired', header: 'Hired', cell: (r) => number.format(r.hired) }]} />
    </div>}
    {exports.isError ? <AsyncState kind="error" title="Export history could not be loaded" description="Try refreshing the history." action={{ label: 'Retry', onClick: () => void exports.refetch() }} /> : <div className="mt-4"><ExportHistory rows={exports.data ?? []} onRefresh={() => void exports.refetch()} /></div>}
    {create.isError ? <p className="mt-3 text-sm text-destructive" role="alert">The export could not be queued. Please try again.</p> : null}
  </PageShell>;
}
