import { NextResponse } from 'next/server';
import { csrfToken } from '@/server/bff/proxy';
import { CSRF_COOKIE } from '@/server/bff/session';

export const runtime = 'nodejs';
export function GET() {
  const token = csrfToken();
  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
