import 'server-only';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  publicSession,
  setSessionCookies,
  type BackendSession,
} from './session';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/v1';
const mutating = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const refreshes = new Map<string, Promise<BackendSession | undefined>>();

function equalSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function csrfToken() {
  return randomBytes(32).toString('base64url');
}
export async function validateCsrf(request: Request) {
  if (!mutating.has(request.method)) return true;
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return false;
  const store = await cookies();
  const cookie = store.get(CSRF_COOKIE)?.value;
  const header = request.headers.get('x-csrf-token');
  return Boolean(cookie && header && equalSecret(cookie, header));
}
async function callApi(
  path: string,
  request: Request,
  accessToken?: string,
  body?: BodyInit,
) {
  const headers = new Headers();
  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (typeof body === 'string' && !headers.has('content-type'))
    headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  return fetch(`${API_URL}/${path}${new URL(request.url).search}`, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });
}
async function rotate(refreshToken: string) {
  const existing = refreshes.get(refreshToken);
  if (existing) return existing;
  const refresh = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  })
    .then(async (response) =>
      response.ok ? ((await response.json()) as BackendSession) : undefined,
    )
    .finally(() => refreshes.delete(refreshToken));
  refreshes.set(refreshToken, refresh);
  return refresh;
}
function copyResponse(response: Response) {
  const headers = new Headers();
  for (const name of ['content-type', 'content-disposition', 'retry-after']) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('cache-control', 'no-store');
  return new NextResponse(response.body, { status: response.status, headers });
}
export async function proxyToApi(request: Request, path: string) {
  if (!(await validateCsrf(request)))
    return NextResponse.json(
      { statusCode: 403, error: 'Forbidden', message: 'Invalid CSRF token' },
      { status: 403 },
    );
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const isLogout = path === 'auth/logout';
  const rawBody = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : await request.arrayBuffer();
  const requestBody = isLogout
    ? JSON.stringify({ refreshToken: refreshToken ?? '' })
    : rawBody;
  let backend = await callApi(path, request, accessToken, requestBody);
  let rotated: BackendSession | undefined;
  if (backend.status === 401 && refreshToken && !path.startsWith('auth/')) {
    rotated = await rotate(refreshToken);
    if (rotated)
      backend = await callApi(path, request, rotated.accessToken, requestBody);
  }
  if (path === 'auth/login' && backend.ok) {
    const session = (await backend.json()) as BackendSession;
    const response = NextResponse.json(publicSession(session));
    setSessionCookies(response, session);
    return response;
  }
  const response = copyResponse(backend);
  if (rotated) setSessionCookies(response, rotated);
  if (isLogout || (backend.status === 401 && refreshToken && !rotated))
    clearSessionCookies(response);
  return response;
}
