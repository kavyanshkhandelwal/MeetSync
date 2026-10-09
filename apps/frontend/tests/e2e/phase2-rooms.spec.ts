import { test, expect } from '@playwright/test';

/**
 * Requires a running stack:
 *   backend  http://127.0.0.1:3001  (npm run dev --workspace backend)
 *   frontend http://127.0.0.1:3000  (npm run dev --workspace frontend)
 * Seeded accounts: admin@company.com / john.doe@company.com  password123
 *
 * These tests fail (they do not skip) if the application is not reachable.
 */

const FRONTEND = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001';
const EMPLOYEE_EMAIL = process.env.PLAYWRIGHT_EMPLOYEE_EMAIL || 'john.doe@company.com';
const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@company.com';
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || 'password123';

async function assertStackUp() {
  const frontend = await fetch(`${FRONTEND}/login`).catch(() => null);
  const backend = await fetch(`${BACKEND}/api/health`).catch(() => null);
  if (!frontend || !frontend.ok && frontend.status >= 500) {
    throw new Error(
      `Frontend is not reachable at ${FRONTEND}. Start it with: npm run dev --workspace frontend`,
    );
  }
  if (!backend) {
    throw new Error(
      `Backend is not reachable at ${BACKEND}. Start it with: npm run dev --workspace backend`,
    );
  }
}

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.locator('#email, input[name="email"]').first().fill(email);
  await page.locator('#password, input[name="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });
}

test.describe('Phase 2 employee room + booking flow', () => {
  test.setTimeout(60_000);

  test('employee views availability and booking UI', async ({ page }) => {
    await assertStackUp();
    await login(page, EMPLOYEE_EMAIL);
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible();
    await page.locator('a[href^="/rooms/"]').first().click();
    await expect(page.getByText('Availability')).toBeVisible();
    await expect(page.getByText('Green days indicate available dates')).toHaveCount(0);
    await expect(page.getByLabel('Date')).toBeVisible();
  });
});

test.describe('Phase 2 admin room management flow', () => {
  test.setTimeout(60_000);

  test('admin can open create-room and is not sent to a missing route', async ({ page }) => {
    await assertStackUp();
    await login(page, ADMIN_EMAIL);
    await page.goto('/rooms');
    await page.getByRole('link', { name: /add room/i }).click();
    await expect(page).toHaveURL(/\/rooms\/add/);
    await expect(page.getByRole('heading', { name: /create room/i })).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Building')).toBeVisible();
  });
});
