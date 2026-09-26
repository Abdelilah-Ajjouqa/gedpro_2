import { apiRequest } from '@/lib/api-client';
import type { Form, FormAssignment, FormInput, FormResponse, FormResponseFilters, FormResponsePage, ReviewStatus } from './types';

export const formKeys = {
  all: (scope: string) => ['forms', scope] as const,
  list: (scope: string, includeArchived: boolean) => ['forms', scope, 'list', { includeArchived }] as const,
  detail: (scope: string, formId: string) => ['forms', scope, 'detail', formId] as const,
  applicationAssignments: (scope: string, applicationId: number) => ['forms', scope, 'application-assignments', applicationId] as const,
};
export const formResponseKeys = {
  list: (scope: string, formId: string, filters: FormResponseFilters) => ['forms', scope, formId, 'responses', filters] as const,
};
export const listForms = (includeArchived: boolean, signal?: AbortSignal) => apiRequest<Form[]>(`/forms?includeArchived=${includeArchived}`, { signal });
export const getForm = (id: string, signal?: AbortSignal) => apiRequest<Form>(`/forms/${id}`, { signal });
export const createForm = (input: FormInput) => apiRequest<Form>('/forms', { method: 'POST', body: JSON.stringify(input) });
export const updateForm = (id: string, input: FormInput) => apiRequest<Form>(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(input) });
export const publishForm = (id: string) => apiRequest<Form>(`/forms/${id}/publish`, { method: 'POST' });
export const duplicateForm = (id: string) => apiRequest<Form>(`/forms/${id}/duplicate`, { method: 'POST' });
export const archiveForm = (id: string) => apiRequest<Form>(`/forms/${id}/archive`, { method: 'PATCH' });
export const deleteForm = (id: string) => apiRequest<void>(`/forms/${id}`, { method: 'DELETE' });
export const assignForm = (id: string, value: Omit<FormAssignment, '_id' | 'formId' | 'createdAt'>) => apiRequest<FormAssignment>(`/forms/${id}/assignments`, { method: 'POST', body: JSON.stringify(value) });
export const getApplicationForms = (applicationId: number, signal?: AbortSignal) => apiRequest<Form[]>(`/forms/assignments/application/${applicationId}`, { signal });
export const submitForm = (id: string, value: { answers: Record<string, unknown>; candidateId?: number; applicationId?: number }) => apiRequest<FormResponse>(`/forms/${id}/submit`, { method: 'POST', body: JSON.stringify(value) });
export const listResponses = (id: string, filters: FormResponseFilters, signal?: AbortSignal) => {
  const q = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.candidateId) q.set('candidateId', String(filters.candidateId));
  if (filters.applicationId) q.set('applicationId', String(filters.applicationId));
  if (filters.reviewStatus) q.set('reviewStatus', filters.reviewStatus);
  return apiRequest<FormResponsePage>(`/forms/${id}/responses?${q}`, { signal });
};
export const reviewResponse = (formId: string, responseId: string, status: Exclude<ReviewStatus, 'pending'>, notes?: string) => apiRequest<FormResponse>(`/forms/${formId}/responses/${responseId}/review`, { method: 'PATCH', body: JSON.stringify({ status, notes: notes || undefined }) });
export const exportResponses = (id: string) => apiRequest<Blob>(`/forms/${id}/responses/export`);
