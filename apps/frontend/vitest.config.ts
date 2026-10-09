import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'frontend',
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    setupFiles: ['tests/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'json-summary', 'html'],
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/app/**/layout.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
