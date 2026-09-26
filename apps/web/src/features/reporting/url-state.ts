import type { ReportFilters } from './types';

const validDate = (value?: string) => Boolean(value && !Number.isNaN(Date.parse(value)));
export function decodeReportFilters(input: URLSearchParams): ReportFilters {
  const from = input.get('from') ?? undefined;
  const to = input.get('to') ?? undefined;
  const rawJob = input.get('jobId');
  const jobId = rawJob && /^\d+$/.test(rawJob) && Number(rawJob) > 0 ? Number(rawJob) : undefined;
  return { from: validDate(from) ? new Date(from!).toISOString() : undefined, to: validDate(to) ? new Date(to!).toISOString() : undefined, jobId, section: input.get('section') ?? undefined };
}
export function encodeReportFilters(filters: ReportFilters) {
  const query = new URLSearchParams();
  if (filters.from) query.set('from', filters.from);
  if (filters.to) query.set('to', filters.to);
  if (filters.jobId) query.set('jobId', String(filters.jobId));
  if (filters.section) query.set('section', filters.section);
  return query.toString();
}
export function defaultReportFilters(): Required<Pick<ReportFilters, 'from' | 'to'>> {
  const to = new Date(); to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to); from.setUTCDate(from.getUTCDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}
