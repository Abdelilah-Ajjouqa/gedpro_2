import 'server-only';
import type { NextResponse } from 'next/server';

const secure = process.env.NODE_ENV === 'production';
const prefix = secure ? '__Host-' : '';
export const ACCESS_COOKIE = `${prefix}gedpro-access`;
export const REFRESH_COOKIE = `${prefix}gedpro-refresh`;
export const CSRF_COOKIE = `${prefix}gedpro-csrf`;
const baseCookie = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };

export type BackendSession = { user: unknown; capabilities: string[]; accessToken: string; refreshToken: string; expiresIn: number };

export function setSessionCookies(response: NextResponse, session: BackendSession) {
  response.cookies.set(ACCESS_COOKIE, session.accessToken, { ...baseCookie, maxAge: session.expiresIn });
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, { ...baseCookie, maxAge: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 604800) });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { ...baseCookie, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 });
}

export function publicSession(session: BackendSession) {
  return { user: session.user, capabilities: session.capabilities, expiresIn: session.expiresIn };
}
