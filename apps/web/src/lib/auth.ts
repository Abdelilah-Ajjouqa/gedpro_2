import { apiRequest } from '@/lib/api-client';

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type AuthSession = {
  user: AuthUser;
  capabilities: string[];
  expiresIn: number;
};

export type CurrentUser = Pick<AuthSession, 'user' | 'capabilities'>;

export function login(email: string, password: string) {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(signal?: AbortSignal) {
  return apiRequest<CurrentUser>('/users/profile', { signal });
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function requestEmailVerification(email: string) {
  return apiRequest<{ message: string }>('/auth/email-verification/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyEmail(token: string) {
  return apiRequest<{ message: string }>('/auth/email-verification/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
