import { test, expect } from '@playwright/test';

/**
 * Requires a running stack:
 *   backend  http://127.0.0.1:3001
 *   frontend http://127.0.0.1:3000
 *
 * These tests fail (they do not skip) if the application is not reachable.
 */

const FRONTEND = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL || 'http://localhost:3001';
const EMPLOYEE_A = process.env.PLAYWRIGHT_EMPLOYEE_EMAIL || 'john.doe@company.com';
const EMPLOYEE_B = process.env.PLAYWRIGHT_EMPLOYEE_B_EMAIL || 'jane.smith@company.com';
const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@company.com';
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || 'password123';

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response | null> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(ms) });
  } catch {
    return null;
  }
}

async function assertStackUp() {
  const frontend = await fetchWithTimeout(`${FRONTEND}/login`);
  const backend = await fetchWithTimeout(`${BACKEND}/api/health`);
  if (!frontend || frontend.status >= 500) {
    throw new Error(
      `Frontend is not reachable at ${FRONTEND}. Start it with: npm run dev --workspace frontend`,
    );
  }
  if (!backend || backend.status >= 500) {
    throw new Error(
      `Backend is not reachable at ${BACKEND}. Start it with: npm run dev --workspace backend`,
    );
  }
}

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.locator('#email, input[name="email"]').first().fill(email);
  await page.locator('#password, input[name="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });
}

function bookingWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const toLocal = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const dateInput = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  return { start, end, toLocal, dateInput };
}

test.describe('Phase 3 realtime booking updates', () => {
  test.setTimeout(90_000);

  test('admin calendar sees another user create and cancel without refresh', async ({ browser }) => {
    await assertStackUp();

    const purpose = `Phase 3 socket ${Date.now()}`;
    const { toLocal, start, end } = bookingWindow();

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await login(pageA, EMPLOYEE_A);
    await login(pageB, ADMIN_EMAIL);

    await pageB.goto('/bookings');
    await expect(pageB.getByRole('main').getByRole('heading', { name: 'Bookings' })).toBeVisible();

    await pageA.goto('/rooms');
    await pageA.locator('a[href^="/rooms/"]').first().click();
    await pageA.getByRole('button', { name: /book now/i }).click();
    await pageA.locator('#startTime').fill(toLocal(start));
    await pageA.locator('#endTime').fill(toLocal(end));
    await pageA.locator('#purpose').fill(purpose);
    await pageA.getByRole('button', { name: /confirm booking/i }).click();

    await expect(pageB.getByText(purpose)).toBeVisible({ timeout: 20_000 });

    await pageA.goto('/my-bookings');
    pageA.once('dialog', (dialog) => dialog.accept());
    await pageA
      .locator('div')
      .filter({ hasText: purpose })
      .getByRole('button', { name: /^cancel$/i })
      .first()
      .click();

    await expect(pageB.getByText(new RegExp(`${purpose} · CANCELLED`))).toBeVisible({
      timeout: 20_000,
    });

    await contextA.close();
    await contextB.close();
  });

  test('employee availability updates when another employee books and cancels', async ({
    browser,
  }) => {
    await assertStackUp();

    const purpose = `Phase 3 availability ${Date.now()}`;
    const { toLocal, start, end, dateInput } = bookingWindow();

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await login(pageA, EMPLOYEE_A);
    await login(pageB, EMPLOYEE_B);

    await pageA.goto('/rooms');
    await pageA.locator('a[href^="/rooms/"]').first().click();
    await expect(pageA.getByRole('heading', { name: 'Availability' })).toBeVisible();
    const roomUrl = pageA.url();

    await pageB.goto(roomUrl);
    await expect(pageB.getByRole('heading', { name: 'Availability' })).toBeVisible();
    await pageB.locator('#availability-date').fill(dateInput);
    const bookedItems = pageB.locator('ul >> li').filter({ hasText: /PENDING|CONFIRMED/i });
    const bookedBefore = await bookedItems.count();
    await expect(pageB.getByText(purpose)).toHaveCount(0);

    await pageA.getByRole('button', { name: /book now/i }).click();
    await pageA.locator('#startTime').fill(toLocal(start));
    await pageA.locator('#endTime').fill(toLocal(end));
    await pageA.locator('#purpose').fill(purpose);
    await pageA.getByRole('button', { name: /confirm booking/i }).click();

    await expect(bookedItems).toHaveCount(bookedBefore + 1, { timeout: 20_000 });
    await expect(pageB.getByText(purpose)).toHaveCount(0);

    await pageA.goto('/my-bookings');
    pageA.once('dialog', (dialog) => dialog.accept());
    await pageA
      .locator('div')
      .filter({ hasText: purpose })
      .getByRole('button', { name: /^cancel$/i })
      .first()
      .click();

    await expect(bookedItems).toHaveCount(bookedBefore, { timeout: 20_000 });

    await contextA.close();
    await contextB.close();
  });
});
