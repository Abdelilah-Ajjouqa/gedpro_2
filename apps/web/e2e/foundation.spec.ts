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

test('administrator can authenticate and open every released workspace', async ({ page }) => {
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!password, 'E2E_ADMIN_PASSWORD is required for the live role journey');

  const browserErrors: string[] = [];
  const clientErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.status() < 500)
      clientErrors.push(`${response.status()} ${response.url()}`);
    if (response.status() >= 500)
      serverErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/login');
  await page.getByLabel('Email address').fill('admin@example.com');
  await page.getByLabel('Password').fill(password!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  browserErrors.length = 0;
  clientErrors.length = 0;
  serverErrors.length = 0;

  const releasedWorkspaces = [
    '/candidates',
    '/jobs',
    '/applications',
    '/interviews',
    '/documents',
    '/forms',
    '/communications',
    '/reports',
    '/settings/pipelines',
    '/settings/scorecard-templates',
    '/settings/users',
  ];
  for (const workspace of releasedWorkspaces) {
    await page.goto(workspace);
    await expect(page).toHaveURL(new RegExp(`${workspace.replaceAll('/', '\\/')}$`));
    await expect(page.locator('main')).toBeVisible();
  }

  expect(serverErrors).toEqual([]);
  expect(clientErrors).toEqual([]);
  expect(browserErrors).toEqual([]);
});
