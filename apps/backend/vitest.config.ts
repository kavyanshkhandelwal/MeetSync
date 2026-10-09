import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'backend',
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    setupFiles: ['tests/setup/vitest.setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'json-summary', 'html'],
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/**/*.d.ts'],
    },
  },
});
