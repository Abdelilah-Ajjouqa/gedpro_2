import type { InterviewListParams } from './types';
function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
export function decodeInterviewList(q: URLSearchParams): InterviewListParams {
  const n = (v: string | null, fallback: number) =>
    v && /^\d+$/.test(v) ? Math.max(1, Number(v)) : fallback;
  const view = q.get('view');
  const sort = q.get('sort');
  const direction = q.get('direction');
  return {
    view: view === 'agenda' ? 'agenda' : 'list',
    from: q.get('from') ?? day(-7),
    to: q.get('to') ?? day(30),
    status: q.get('status') ?? '',
    type: q.get('type') ?? '',
    applicationId: q.get('applicationId')
      ? n(q.get('applicationId'), 1)
      : undefined,
    interviewerId: q.get('interviewerId') ?? '',
    feedback: q.get('feedback') ?? 'all',
    sort: sort === 'updatedAt' ? sort : 'date',
    direction: direction === 'desc' ? direction : 'asc',
    page: n(q.get('page'), 1),
    limit: [10, 20, 50].includes(n(q.get('limit'), 20))
      ? n(q.get('limit'), 20)
      : 20,
    tz: q.get('tz') ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
export function encodeInterviewList(p: InterviewListParams) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (
      v !== undefined &&
      v !== '' &&
      !(k === 'feedback' && v === 'all') &&
      !(k === 'page' && v === 1) &&
      !(k === 'limit' && v === 20) &&
      !(k === 'view' && v === 'list')
    )
      q.set(k, String(v));
  });
  return q.toString();
}
export function formatInterviewTime(value: string, tz: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(value));
  }
}
