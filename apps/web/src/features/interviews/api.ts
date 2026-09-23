import { apiRequest } from '@/lib/api-client';
import type {
  DecisionSummary,
  InterviewDetail,
  InterviewListParams,
  InterviewPage,
  Template,
} from './types';
export const interviewKeys = {
  all: (s: string) => ['interviews', s] as const,
  lists: (s: string) => ['interviews', s, 'list'] as const,
  list: (s: string, p: InterviewListParams) =>
    ['interviews', s, 'list', p] as const,
  detail: (s: string, id: number) => ['interviews', s, 'detail', id] as const,
  dashboard: (s: string, p: object) =>
    ['interviews', s, 'dashboard', p] as const,
};
export const decisionKeys = {
  application: (s: string, id: number) =>
    ['interview-decisions', s, id] as const,
};
export const templateKeys = {
  all: (s: string) => ['scorecard-templates', s] as const,
};
function qs(p: Partial<InterviewListParams>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  q.delete('view');
  return q;
}
export const listInterviews = (p: InterviewListParams, signal?: AbortSignal) =>
  apiRequest<InterviewPage>(`/interviews?${qs(p)}`, { signal });
export const getInterview = (id: number, signal?: AbortSignal) =>
  apiRequest<InterviewDetail>(`/interviews/${id}`, { signal });
export const createInterview = (body: object) =>
  apiRequest<InterviewDetail>('/interviews', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const rescheduleInterview = (
  id: number,
  version: number,
  body: object,
) =>
  apiRequest<InterviewDetail>(`/interviews/${id}/reschedule`, {
    method: 'PATCH',
    headers: { 'If-Match': `"${version}"` },
    body: JSON.stringify(body),
  });
export const outcomeInterview = (
  id: number,
  version: number,
  status: string,
  reason?: string,
) =>
  apiRequest<InterviewDetail>(`/interviews/${id}/outcome`, {
    method: 'PATCH',
    headers: { 'If-Match': `"${version}"` },
    body: JSON.stringify({ status, reason }),
  });
export const listTemplates = (signal?: AbortSignal) =>
  apiRequest<Template[]>('/interviews/scorecard-templates/list', { signal });
export const createTemplate = (body: object) =>
  apiRequest<Template>('/interviews/scorecard-templates', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const submitScorecard = (id: number, body: object) =>
  apiRequest<unknown>(`/interviews/scorecards/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const getDecisionSummary = (
  applicationId: number,
  signal?: AbortSignal,
) =>
  apiRequest<DecisionSummary>(
    `/interviews/applications/${applicationId}/decision-summary`,
    { signal },
  );
