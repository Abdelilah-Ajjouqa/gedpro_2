const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';
const ACCESS_TOKEN_KEY = 'gedpro.accessToken';
const REFRESH_TOKEN_KEY = 'gedpro.refreshToken';
let refreshRequest: Promise<string | undefined> | undefined;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAccessToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}

export function saveTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasSession() {
  return typeof window !== 'undefined' && Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY) || window.localStorage.getItem(REFRESH_TOKEN_KEY));
}

async function refreshAccessToken() {
  if (typeof window === 'undefined') return undefined;
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return undefined;
  if (!refreshRequest) refreshRequest = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }),
  }).then(async (response) => {
    if (!response.ok) { clearTokens(); return undefined; }
    const session = await response.json() as { accessToken: string; refreshToken: string };
    saveTokens(session.accessToken, session.refreshToken);
    return session.accessToken;
  }).finally(() => { refreshRequest = undefined; });
  return refreshRequest;
}

export function getApiScope() {
  if (typeof window === 'undefined') return 'anonymous';
  return window.localStorage.getItem('gedpro.tenantId') ?? 'current-user';
}

export async function apiRequest<T>(path: string, init?: RequestInit, allowRefresh = true): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    signal: init?.signal,
  });

  if (response.status === 401 && allowRefresh && !path.startsWith('/auth/')) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) return apiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    const apiOrigin = new URL(API_URL).origin;
    const isCallingWebApp = typeof window !== 'undefined' && apiOrigin === window.location.origin;
    const message = isCallingWebApp && response.status === 404
      ? 'The API URL points to the web server. Start both apps with `npm run dev` and open http://localhost:3000.'
      : body?.message ?? `API request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
