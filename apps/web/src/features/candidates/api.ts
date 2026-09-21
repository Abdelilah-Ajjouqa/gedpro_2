import { apiRequest } from '@/lib/api-client';
import type {
  CandidateFormValues,
  CandidateListParams,
  CandidateListResponse,
  CandidateProfile,
  CandidateState,
} from './types';
export const candidateKeys = {
  all: (s: string) => ['candidates', s] as const,
  lists: (s: string) => ['candidates', s, 'list'] as const,
  list: (s: string, p: CandidateListParams) =>
    ['candidates', s, 'list', p] as const,
  detail: (s: string, id: number) => ['candidates', s, 'detail', id] as const,
  duplicates: (s: string, id: number) =>
    ['candidates', s, 'duplicates', id] as const,
};
export function listCandidates(p: CandidateListParams, signal?: AbortSignal) {
  const q = new URLSearchParams({
    page: String(p.page),
    limit: String(p.limit),
    sortBy: p.sort,
    sortOrder: p.direction.toUpperCase(),
    disposition: p.disposition,
  });
  if (p.q) q.set('search', p.q);
  if (p.tag) q.set('tag', p.tag);
  if (p.skill) q.set('skill', p.skill);
  if (p.source) q.set('source', p.source);
  if (p.ownerId) q.set('ownerId', String(p.ownerId));
  if (p.state) q.set('state', p.state);
  return apiRequest<CandidateListResponse>(`/candidates?${q}`, { signal });
}
export const getCandidate = (id: number, signal?: AbortSignal) =>
  apiRequest<CandidateProfile>(`/candidates/${id}`, { signal });
export const createCandidate = (v: CandidateFormValues) =>
  apiRequest<CandidateProfile>('/candidates', {
    method: 'POST',
    body: JSON.stringify(v),
  });
export const updateCandidate = (
  id: number,
  version: number,
  v: Partial<CandidateFormValues>,
) =>
  apiRequest<CandidateProfile>(`/candidates/${id}`, {
    method: 'PATCH',
    headers: { 'If-Match': `"${version}"` },
    body: JSON.stringify(v),
  });
export const lifecycleCandidate = (
  id: number,
  version: number,
  action: 'archive' | 'restore',
) =>
  apiRequest<CandidateProfile>(`/candidates/${id}/${action}`, {
    method: 'POST',
    headers: { 'If-Match': `"${version}"` },
  });
export const updateCandidateState = (
  id: number,
  version: number,
  state: CandidateState,
  comment?: string,
) =>
  apiRequest<CandidateProfile>(`/candidates/${id}/state`, {
    method: 'PATCH',
    headers: { 'If-Match': `"${version}"` },
    body: JSON.stringify({ state, comment }),
  });
export const requestCandidateDeletion = (id: number, version: number) =>
  apiRequest<{ status: string; requestedAt: string }>(
    `/candidates/${id}/privacy/deletion-request`,
    { method: 'POST', headers: { 'If-Match': `"${version}"` } },
  );
export const eraseCandidate = (id: number, version: number) =>
  apiRequest<CandidateProfile>(`/candidates/${id}/privacy/erase`, {
    method: 'POST',
    headers: { 'If-Match': `"${version}"` },
  });
export const exportCandidate = (id: number) =>
  apiRequest<Blob>(`/candidates/${id}/privacy/export`, { method: 'POST' });
