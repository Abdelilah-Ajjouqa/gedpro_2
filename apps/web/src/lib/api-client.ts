const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

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
  return window.localStorage.getItem('gedpro.accessToken') ?? undefined;
}

export function getApiScope() {
  if (typeof window === 'undefined') return 'anonymous';
  return window.localStorage.getItem('gedpro.tenantId') ?? 'current-user';
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `API request failed (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}
