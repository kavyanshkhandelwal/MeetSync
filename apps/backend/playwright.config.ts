import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: 0,
  timeout: 10_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BACKEND_URL || 'http://127.0.0.1:3001',
  },
});
