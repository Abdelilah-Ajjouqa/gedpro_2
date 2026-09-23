import { apiRequest } from '@/lib/api-client';
import type { DocumentListParams, DocumentListResponse } from './types';

export const documentKeys = {
  all: (scope: string) => ['documents', scope] as const,
  lists: (scope: string) => [...documentKeys.all(scope), 'list'] as const,
  list: (scope: string, params: DocumentListParams) =>
    [...documentKeys.lists(scope), params] as const,
};
export function listDocuments(
  params: DocumentListParams,
  signal?: AbortSignal,
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return apiRequest<DocumentListResponse>(`/documents?${search}`, { signal });
}
