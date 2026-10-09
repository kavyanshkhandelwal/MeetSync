import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: 0,
  timeout: 15_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
  },
  /* Start the frontend yourself: npm run dev --workspace frontend
     Start the backend yourself: npm run dev --workspace backend
     Phase 2 e2e tests fail if either service is down (they do not skip). */
});
