import type { DocumentListParams } from './types';

const defaults: DocumentListParams = {
  q: '',
  status: 'active',
  sort: 'createdAt',
  direction: 'desc',
  page: 1,
  limit: 25,
};
export function decodeDocumentList(
  search: URLSearchParams,
): DocumentListParams {
  const number = (key: string, fallback: number) => {
    const value = Number(search.get(key));
    return Number.isInteger(value) && value > 0 ? value : fallback;
  };
  const category = search.get('category');
  const status = search.get('status');
  const sort = search.get('sort');
  const direction = search.get('direction');
  return {
    q: search.get('q')?.trim() ?? '',
    category: [
      'resume',
      'cover_letter',
      'portfolio',
      'offer',
      'other',
    ].includes(category ?? '')
      ? (category as DocumentListParams['category'])
      : undefined,
    status: status === 'archived' ? 'archived' : 'active',
    sort: ['createdAt', 'name', 'category', 'status'].includes(sort ?? '')
      ? (sort as DocumentListParams['sort'])
      : defaults.sort,
    direction: direction === 'asc' ? 'asc' : 'desc',
    page: number('page', 1),
    limit: Math.min(number('limit', 25), 100),
  };
}
export function encodeDocumentList(params: DocumentListParams) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.status !== defaults.status) search.set('status', params.status);
  if (params.sort !== defaults.sort) search.set('sort', params.sort);
  if (params.direction !== defaults.direction)
    search.set('direction', params.direction);
  if (params.page !== defaults.page) search.set('page', String(params.page));
  if (params.limit !== defaults.limit)
    search.set('limit', String(params.limit));
  return search.toString();
}
