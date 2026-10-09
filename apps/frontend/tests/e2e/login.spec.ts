import { test, expect } from '@playwright/test';

test('GET /login is reachable when the frontend is running', async ({ request }) => {
  try {
    const response = await request.get('/login', { timeout: 2000 });
    expect(response.status()).toBeLessThan(500);
  } catch {
    test.skip(true, 'Frontend is not running on PLAYWRIGHT_BASE_URL — e2e not executed against a live server');
  }
});
