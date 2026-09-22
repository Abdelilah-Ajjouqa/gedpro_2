import { apiRequest } from '@/lib/api-client';
import type { TimelineEvent, TimelinePage } from './types';

export const timelineKeys = {
  all: (scope: string) => ['timeline', scope] as const,
  candidate: (scope: string, id: number, limit = 20) =>
    ['timeline', scope, 'candidate', id, { limit }] as const,
  application: (scope: string, id: number, limit = 20) =>
    ['timeline', scope, 'application', id, { limit }] as const,
};
export function getTimeline(
  target: 'candidate' | 'application',
  id: number,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ limit: '20' });
  if (cursor) query.set('cursor', cursor);
  return apiRequest<TimelinePage>(`/${target}s/${id}/timeline?${query}`, {
    signal,
  });
}
export function createNote(
  target: 'candidate' | 'application',
  id: number,
  text: string,
) {
  return apiRequest<TimelineEvent>(`/${target}s/${id}/timeline/notes`, {
    method: 'POST',
    body: JSON.stringify({ text: text.trim() }),
  });
}
