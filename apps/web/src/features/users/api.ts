import { apiRequest } from '@/lib/api-client';
import type {
  AdminUserDetail,
  AdminUserListItem,
  UserDirectoryFilters,
  UserRole,
} from './types';
type QueryScope = string;
export const userAdminKeys = {
  all: (scope: QueryScope) => ['users', scope] as const,
  list: (scope: QueryScope, filters: UserDirectoryFilters) =>
    ['users', scope, 'list', filters] as const,
  detail: (scope: QueryScope, id: number) =>
    ['users', scope, 'detail', id] as const,
  profile: (scope: QueryScope) => ['users', scope, 'profile'] as const,
};
export function listUsers(filters: UserDirectoryFilters, signal?: AbortSignal) {
  const p = new URLSearchParams();
  if (filters.q) p.set('q', filters.q);
  if (filters.role) p.set('role', filters.role);
  if (filters.active !== undefined) p.set('active', String(filters.active));
  p.set('page', String(filters.page));
  p.set('limit', String(filters.limit));
  return apiRequest<{
    data: AdminUserListItem[];
    total: number;
    page: number;
    limit: number;
  }>(`/users?${p}`, { signal });
}
export function getUser(id: number, signal?: AbortSignal) {
  return apiRequest<AdminUserDetail>(`/users/${id}`, { signal });
}
export function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}) {
  return apiRequest<AdminUserDetail>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export function updateUser(
  id: number,
  input: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  }>,
) {
  return apiRequest<AdminUserDetail>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
export function setUserActive(id: number, active: boolean, reason: string) {
  return apiRequest<AdminUserDetail>(
    `/users/${id}/${active ? 'activate' : 'deactivate'}`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  );
}
