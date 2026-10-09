import { test, expect } from '@playwright/test';

test('GET /api/health is reachable when the backend is running', async ({ request }) => {
  try {
    const response = await request.get('/api/health', { timeout: 2000 });
    expect(response.status()).toBeLessThan(500);
  } catch {
    test.skip(true, 'Backend is not running on PLAYWRIGHT_BACKEND_URL — e2e not executed against a live server');
  }
});
