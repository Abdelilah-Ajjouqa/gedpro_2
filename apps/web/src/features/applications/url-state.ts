import type { ApplicationListParams } from './types';
export function decodeApplicationList(
  q: URLSearchParams,
  fixedJobId?: number,
): ApplicationListParams {
  const positive = (v: string | null) =>
    v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : undefined;
  const terminal = q.get('terminal');
  const sort = q.get('sort');
  const direction = q.get('direction');
  return {
    q: (q.get('q') ?? '').slice(0, 200),
    jobId: fixedJobId ?? positive(q.get('jobId')),
    candidateId: positive(q.get('candidateId')),
    stageCategory: q.get('stageCategory') || undefined,
    terminal:
      terminal === 'active' || terminal === 'terminal' ? terminal : 'all',
    sort:
      sort === 'updatedAt' ||
      sort === 'candidate' ||
      sort === 'job' ||
      sort === 'stage'
        ? sort
        : 'createdAt',
    direction: direction === 'asc' ? 'asc' : 'desc',
    page: positive(q.get('page')) ?? 1,
    limit: Math.min(100, positive(q.get('limit')) ?? 20),
  };
}
export function encodeApplicationList(
  p: ApplicationListParams,
  fixedJob = false,
) {
  const q = new URLSearchParams();
  if (p.q) q.set('q', p.q);
  if (p.jobId && !fixedJob) q.set('jobId', String(p.jobId));
  if (p.candidateId) q.set('candidateId', String(p.candidateId));
  if (p.stageCategory) q.set('stageCategory', p.stageCategory);
  if (p.terminal !== 'all') q.set('terminal', p.terminal);
  if (p.sort !== 'createdAt') q.set('sort', p.sort);
  if (p.direction !== 'desc') q.set('direction', p.direction);
  if (p.page !== 1) q.set('page', String(p.page));
  if (p.limit !== 20) q.set('limit', String(p.limit));
  return q.toString();
}
