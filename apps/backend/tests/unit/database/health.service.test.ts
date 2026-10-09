import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryRaw = vi.fn();

vi.mock('../../../src/config/prisma', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

import { HealthService } from '../../../src/services/health.service';

describe('HealthService', () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports healthy when SELECT 1 succeeds', async () => {
    queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const result = await new HealthService().checkHealth();
    expect(result.status).toBe('healthy');
    expect(result.database).toBe('connected');
    expect(typeof result.timestamp).toBe('number');
  });

  it('reports unhealthy when the query throws', async () => {
    queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await new HealthService().checkHealth();
    expect(result.status).toBe('unhealthy');
    expect(result.database).toBe('disconnected');
  });
});
