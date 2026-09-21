import { apiRequest } from '@/lib/api-client';
import type {
  ApplicationDetail,
  ApplicationListParams,
  ApplicationListResponse,
} from './types';
export const applicationKeys = {
  all: (s: string) => ['applications', s] as const,
  lists: (s: string) => ['applications', s, 'list'] as const,
  list: (s: string, p: ApplicationListParams) =>
    ['applications', s, 'list', p] as const,
  detail: (s: string, id: number) => ['applications', s, 'detail', id] as const,
  job: (s: string, id: number, p: ApplicationListParams) =>
    ['applications', s, 'job', id, p] as const,
};
export function listApplications(
  p: ApplicationListParams,
  signal?: AbortSignal,
) {
  const q = new URLSearchParams({
    page: String(p.page),
    limit: String(p.limit),
    terminal: p.terminal,
    sort: p.sort,
    direction: p.direction,
  });
  if (p.q) q.set('search', p.q);
  if (p.jobId) q.set('jobId', String(p.jobId));
  if (p.candidateId) q.set('candidateId', String(p.candidateId));
  if (p.stageCategory) q.set('stageCategory', p.stageCategory);
  return apiRequest<ApplicationListResponse>(`/applications?${q}`, { signal });
}
export const getApplication = (id: number, signal?: AbortSignal) =>
  apiRequest<ApplicationDetail>(`/applications/${id}`, { signal });
export const createApplication = (value: {
  candidateId: number;
  jobId: number;
  source?: string;
}) =>
  apiRequest<ApplicationDetail>('/applications', {
    method: 'POST',
    body: JSON.stringify(value),
  });
export const transitionApplication = (
  id: number,
  version: number,
  value: { stageId: number; comment?: string; rejectionReason?: string },
) =>
  apiRequest<ApplicationDetail>(`/applications/${id}/stage`, {
    method: 'PATCH',
    headers: { 'If-Match': `"${version}"` },
    body: JSON.stringify(value),
  });
export const reopenApplication = (
  id: number,
  version: number,
  comment?: string,
) =>
  apiRequest<ApplicationDetail>(`/applications/${id}/reopen`, {
    method: 'POST',
    headers: { 'If-Match': `"${version}"` },
    body: JSON.stringify({ comment }),
  });
