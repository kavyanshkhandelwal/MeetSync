import { describe, expect, it } from 'vitest';
import { REDIS_CONNECT_TIMEOUT_MS, createQueueRedisConnection } from '../../../src/config/redis';

describe('Redis queue client fail-fast', () => {
  it('settles within the connect timeout instead of hanging', async () => {
    const started = Date.now();
    const redis = createQueueRedisConnection();
    try {
      await redis.ping();
    } catch {
      // Redis may be down in this environment; rejection is the expected fail-fast path.
    } finally {
      redis.disconnect();
    }
    expect(Date.now() - started).toBeLessThan(REDIS_CONNECT_TIMEOUT_MS + 1500);
  });
});
