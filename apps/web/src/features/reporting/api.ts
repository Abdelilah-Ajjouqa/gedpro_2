import { apiRequest } from '@/lib/api-client';
import type { JobListResponse } from '@/features/jobs/types';
import type { JobOption, ReportExportFormat, ReportExportListItem, ReportFilters, ReportSummary } from './types';

const query = (filters: ReportFilters) => { const p = new URLSearchParams(); if (filters.from) p.set('from', filters.from); if (filters.to) p.set('to', filters.to); if (filters.jobId) p.set('jobId', String(filters.jobId)); return p.toString(); };
export const reportingKeys = { all: (scope: string) => ['reporting', scope] as const, summary: (scope: string, filters: ReportFilters) => ['reporting', scope, 'summary', filters] as const, exports: (scope: string) => ['reporting', scope, 'exports'] as const, jobs: (scope: string) => ['reporting', scope, 'jobs'] as const };
export const getReportSummary = (filters: ReportFilters, signal?: AbortSignal) => apiRequest<ReportSummary>(`/reports/summary${query(filters) ? `?${query(filters)}` : ''}`, { signal });
type ApiExport = Omit<ReportExportListItem, 'requester'> & { requestedBy?: { firstName?: string; lastName?: string } };
const exportRow = (row: ApiExport): ReportExportListItem => ({ ...row, requester: row.requestedBy ? `${row.requestedBy.firstName ?? ''} ${row.requestedBy.lastName ?? ''}`.trim() || 'You' : 'You' });
export const listReportExports = async (signal?: AbortSignal) => (await apiRequest<ApiExport[]>('/reports/exports', { signal })).map(exportRow);
export const createReportExport = async (filters: ReportFilters, format: ReportExportFormat) => exportRow(await apiRequest<ApiExport>('/reports/exports', { method: 'POST', body: JSON.stringify({ ...filters, format }) }));
export const listReportJobs = async (signal?: AbortSignal): Promise<JobOption[]> => (await apiRequest<JobListResponse>('/jobs?page=1&limit=100&sort=title&direction=asc', { signal })).data.map(({ id, title }) => ({ id, title }));
export async function downloadReportExport(id: string) {
  const result = await apiRequest<Blob>(`/reports/exports/${id}/download`);
  const url = URL.createObjectURL(result); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `gedpro-report-${id}`; anchor.click(); URL.revokeObjectURL(url);
}
