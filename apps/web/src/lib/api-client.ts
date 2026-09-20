const API_URL = '/api/bff';
const CSRF_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-gedpro-csrf' : 'gedpro-csrf';

export type ApiErrorPayload = { statusCode?: number; error?: string; message?: string | string[]; path?: string; timestamp?: string; requestId?: string };
export type ApiErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'rate-limited' | 'server' | 'network' | 'aborted' | 'unexpected';

function errorKind(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server';
  return 'unexpected';
}

export class ApiError extends Error {
  readonly messages: string[];
  readonly kind: ApiErrorKind;
  constructor(message: string | string[], readonly status: number, readonly payload?: ApiErrorPayload) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages.join(' ')); this.name = 'ApiError'; this.messages = messages; this.kind = errorKind(status);
  }
}

function cookieValue(name: string) {
  if (typeof document === 'undefined') return undefined;
  return document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function csrfToken() {
  const existing = cookieValue(CSRF_COOKIE); if (existing) return decodeURIComponent(existing);
  const response = await fetch(`${API_URL}/auth/csrf`, { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new ApiError('Unable to establish request security.', response.status);
  return ((await response.json()) as { token: string }).token;
}

export function clearLegacySession() {
  if (typeof window === 'undefined') return;
  for (const key of ['gedpro.accessToken', 'gedpro.refreshToken', 'gedpro.tenantId']) window.localStorage.removeItem(key);
}

export function getApiScope(userId?: number) { return userId ? `user:${userId}` : 'anonymous'; }

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers); headers.set('accept', headers.get('accept') ?? 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('x-csrf-token', await csrfToken());
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, method, headers, credentials: 'same-origin', cache: 'no-store' });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the server.', 0, { message: 'Network error' });
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as ApiErrorPayload | undefined;
    throw new ApiError(payload?.message ?? `API request failed (${response.status})`, response.status, payload);
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json() as Promise<T>;
  if (contentType.startsWith('text/')) return response.text() as Promise<T>;
  return response.blob() as Promise<T>;
}
