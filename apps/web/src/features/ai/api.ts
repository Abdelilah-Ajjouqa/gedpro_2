import { apiRequest } from '@/lib/api-client';

export const aiKeys = {
  all: (scope: string) => ['ai', scope] as const,
  candidateSearch: (scope: string, query: string, limit: number) =>
    ['ai', scope, 'candidate-search', query, limit] as const,
};

export type AiSearchResult = {
  candidateId: number;
  name: string;
  score: number;
  evidence: { matchedTerms: string[]; skills: string[]; tags: string[] };
};
export type AiSearchResponse = {
  generationId: string;
  advisory: true;
  results: AiSearchResult[];
};

export function searchCandidates(
  query: string,
  limit: number,
  signal?: AbortSignal,
) {
  return apiRequest<AiSearchResponse>('/ai/candidate-search', {
    method: 'POST',
    signal,
    body: JSON.stringify({ query, limit }),
  });
}

export type CvExtractionResponse = {
  id: string;
  advisory: true;
  extracted: Record<string, unknown>;
  effective: Record<string, unknown>;
};
export function extractCv(candidateId: number, text: string) {
  return apiRequest<CvExtractionResponse>('/ai/cv-extractions', {
    method: 'POST',
    body: JSON.stringify({ candidateId, text }),
  });
}

export function correctExtraction(
  id: string,
  corrected: Record<string, unknown>,
  reason?: string,
) {
  return apiRequest<CvExtractionResponse>(`/ai/cv-extractions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ corrected, reason }),
  });
}
