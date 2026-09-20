import { expect, test } from '@playwright/test';

test('renders the sign-in flow with an untrusted return target', async ({ page }) => {
  await page.goto('/login?next=https://example.com');
  await expect(page.getByRole('heading', { name: 'Sign in to GEDPro' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('issues a same-origin CSRF token', async ({ request }) => {
  const response = await request.get('/api/bff/auth/csrf');
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ token: expect.any(String) });
});

test('rejects a state-changing request without CSRF proof', async ({ request }) => {
  const response = await request.post('/api/bff/auth/login', {
    data: { email: 'candidate@example.com', password: 'not-a-real-password' },
  });
  expect(response.status()).toBe(403);
  await expect(response.json()).resolves.toMatchObject({ message: 'Invalid CSRF token' });
});
