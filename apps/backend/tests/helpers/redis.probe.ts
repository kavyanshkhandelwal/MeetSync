import IORedis from 'ioredis';
import { env } from '../../src/config';

export async function canReachRedis(timeoutMs = 1000): Promise<boolean> {
  const redis = new IORedis(env.REDIS_URL, {
    connectTimeout: timeoutMs,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  } finally {
    redis.disconnect();
  }
}
