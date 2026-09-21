import { apiRequest } from '@/lib/api-client';
import type { JobDetailModel, JobListParams, JobListResponse } from './types';

export const jobKeys = {
  all: (scope: string) => ['jobs', scope] as const,
  lists: (scope: string) => [...jobKeys.all(scope), 'list'] as const,
  list: (scope: string, params: JobListParams) => [...jobKeys.lists(scope), params] as const,
  detail: (scope: string, id: number) => [...jobKeys.all(scope), 'detail', id] as const,
};
export async function listJobs(params: JobListParams, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit), sort: params.sort, direction: params.direction });
  if (params.q) query.set('search', params.q.trim()); if (params.status) query.set('status', params.status); if (params.ownerId) query.set('ownerId', String(params.ownerId));
  return apiRequest<JobListResponse>(`/jobs?${query}`, { signal });
}
export const getJob = (id: number, signal?: AbortSignal) => apiRequest<JobDetailModel>(`/jobs/${id}`, { signal });
export type JobFormValues = { title: string; description: string; department?: string; location?: string; employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship' | 'other'; pipelineId: number };
export const createJob = (values: JobFormValues) => apiRequest<JobDetailModel>('/jobs', { method: 'POST', body: JSON.stringify(values) });
export const updateJob = (id: number, version: number, values: Partial<JobFormValues>) => apiRequest<JobDetailModel>(`/jobs/${id}`, { method: 'PATCH', headers: { 'If-Match': `"${version}"` }, body: JSON.stringify(values) });
export const transitionJob = (id: number, version: number, action: 'publish' | 'close' | 'reopen' | 'archive') => apiRequest<JobDetailModel>(`/jobs/${id}/${action}`, { method: 'POST', headers: { 'If-Match': `"${version}"` } });
