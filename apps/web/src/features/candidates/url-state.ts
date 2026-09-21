import type { CandidateListParams, CandidateState } from './types';
const states = new Set([
  'new',
  'preselected',
  'interview_scheduled',
  'in_interview',
  'accepted',
  'rejected',
]);
const dispositions = new Set(['active', 'archived', 'all']);
const sorts = new Set(['createdAt', 'updatedAt', 'lastName', 'email']);
export function decodeCandidateList(
  search: URLSearchParams,
): CandidateListParams {
  const state = search.get('state');
  const disposition = search.get('disposition');
  const sort = search.get('sort');
  const limit = Number(search.get('limit')) || 20;
  return {
    q: search.get('q')?.trim() ?? '',
    tag: search.get('tag') || undefined,
    skill: search.get('skill') || undefined,
    source: search.get('source') || undefined,
    ownerId: Number(search.get('ownerId')) || undefined,
    disposition: dispositions.has(disposition ?? '')
      ? (disposition as CandidateListParams['disposition'])
      : 'active',
    state: states.has(state ?? '') ? (state as CandidateState) : undefined,
    sort: sorts.has(sort ?? '')
      ? (sort as CandidateListParams['sort'])
      : 'createdAt',
    direction: search.get('direction') === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, Number(search.get('page')) || 1),
    limit: [10, 20, 50, 100].includes(limit)
      ? (limit as CandidateListParams['limit'])
      : 20,
  };
}
export function encodeCandidateList(p: CandidateListParams) {
  const q = new URLSearchParams();
  if (p.q) q.set('q', p.q);
  if (p.tag) q.set('tag', p.tag);
  if (p.skill) q.set('skill', p.skill);
  if (p.source) q.set('source', p.source);
  if (p.ownerId) q.set('ownerId', String(p.ownerId));
  if (p.disposition !== 'active') q.set('disposition', p.disposition);
  if (p.state) q.set('state', p.state);
  if (p.sort !== 'createdAt') q.set('sort', p.sort);
  if (p.direction !== 'desc') q.set('direction', p.direction);
  if (p.page !== 1) q.set('page', String(p.page));
  if (p.limit !== 20) q.set('limit', String(p.limit));
  return q.toString();
}
