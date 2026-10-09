import IORedis, { RedisOptions } from 'ioredis';
import { env } from './index';
import { logger } from '../utils/logger';

export const REDIS_CONNECT_TIMEOUT_MS = 3000;

const sharedOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
  enableReadyCheck: true,
};

function logRedisError(label: string, err: Error): void {
  logger.error(`${label}:`, err.message);
}

/** Fail-fast client for the API process (enqueue / remove only). */
export function createQueueRedisConnection(): IORedis {
  const connection = new IORedis(env.REDIS_URL, {
    ...sharedOptions,
    enableOfflineQueue: false,
    retryStrategy() {
      return null;
    },
  });
  connection.on('error', (err) => logRedisError('Redis (queue) error', err));
  return connection;
}

/** Reconnecting client for the standalone worker process. */
export function createWorkerRedisConnection(): IORedis {
  const connection = new IORedis(env.REDIS_URL, {
    ...sharedOptions,
    enableOfflineQueue: true,
    retryStrategy(times) {
      return Math.min(times * 200, 2000);
    },
  });
  connection.on('error', (err) => logRedisError('Redis (worker) error', err));
  return connection;
}

export async function disconnectRedis(connection: IORedis | null): Promise<void> {
  if (!connection) {
    return;
  }
  try {
    connection.disconnect();
  } catch (err) {
    logger.warn('Redis disconnect failed:', err instanceof Error ? err.message : err);
  }
}
