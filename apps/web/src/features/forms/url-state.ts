import type { FormResponseFilters, ReviewStatus } from './types';
export const defaultResponseFilters: FormResponseFilters = { page: 1, limit: 20 };
export function responseFiltersFromSearch(search: URLSearchParams): FormResponseFilters {
  const number = (key: string) => { const value = Number(search.get(key)); return Number.isInteger(value) && value > 0 ? value : undefined; };
  const status = search.get('reviewStatus');
  return { candidateId: number('candidateId'), applicationId: number('applicationId'), reviewStatus: status === 'pending' || status === 'approved' || status === 'rejected' ? status as ReviewStatus : undefined, page: number('page') ?? 1, limit: Math.min(number('limit') ?? 20, 100) };
}
export function responseFiltersToSearch(filters: FormResponseFilters) {
  const q = new URLSearchParams();
  if (filters.candidateId) q.set('candidateId', String(filters.candidateId));
  if (filters.applicationId) q.set('applicationId', String(filters.applicationId));
  if (filters.reviewStatus) q.set('reviewStatus', filters.reviewStatus);
  if (filters.page !== 1) q.set('page', String(filters.page));
  if (filters.limit !== 20) q.set('limit', String(filters.limit));
  return q.toString();
}
