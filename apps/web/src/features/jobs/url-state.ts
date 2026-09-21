import type { JobListParams, JobStatus } from './types';
const statuses = new Set(['draft', 'published', 'closed', 'archived']);
const sorts = new Set(['createdAt', 'updatedAt', 'title', 'status']);
export function decodeJobList(search: URLSearchParams): JobListParams {
  const status = search.get('status'); const sort = search.get('sort'); const direction = search.get('direction');
  const page = Math.max(1, Number(search.get('page')) || 1); const limitValue = Number(search.get('limit')) || 20;
  return { q: search.get('q')?.trim() ?? '', status: statuses.has(status ?? '') ? status as JobStatus : undefined, ownerId: Number(search.get('ownerId')) || undefined, sort: sorts.has(sort ?? '') ? sort as JobListParams['sort'] : 'createdAt', direction: direction === 'asc' ? 'asc' : 'desc', page, limit: [10, 20, 50, 100].includes(limitValue) ? limitValue : 20 };
}
export function encodeJobList(params: JobListParams) { const q = new URLSearchParams(); if (params.q) q.set('q', params.q); if (params.status) q.set('status', params.status); if (params.ownerId) q.set('ownerId', String(params.ownerId)); if (params.sort !== 'createdAt') q.set('sort', params.sort); if (params.direction !== 'desc') q.set('direction', params.direction); if (params.page !== 1) q.set('page', String(params.page)); if (params.limit !== 20) q.set('limit', String(params.limit)); return q.toString(); }
