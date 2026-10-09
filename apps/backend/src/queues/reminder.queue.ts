import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { env } from '../config';
import { createQueueRedisConnection, disconnectRedis } from '../config/redis';
import { logger } from '../utils/logger';

export const REMINDER_QUEUE_NAME = env.REMINDER_QUEUE_NAME;

export const REMINDER_JOB_NAME = 'reminder';

export const REMINDER_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1000 },
  removeOnComplete: true,
  removeOnFail: false,
};

let connection: IORedis | null = null;
let queue: Queue | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = createQueueRedisConnection();
  }
  return connection;
}

export function getReminderQueue(): Queue {
  if (!queue) {
    queue = new Queue(REMINDER_QUEUE_NAME, { connection: getConnection() });
  }
  return queue;
}

export async function closeReminderQueue(): Promise<void> {
  if (queue) {
    try {
      await queue.close();
    } catch (err) {
      logger.warn('Reminder queue close failed:', err instanceof Error ? err.message : err);
    }
    queue = null;
  }
  await disconnectRedis(connection);
  connection = null;
}

export type ReminderJobData = {
  bookingId: string;
  userEmail: string;
  purpose: string;
  startTime: string;
  endTime?: string;
  roomName?: string;
  status?: string;
};

export function reminderJobId(bookingId: string): string {
  return bookingId;
}

export async function addReminderJob(data: ReminderJobData, delayMs: number): Promise<void> {
  await getReminderQueue().add(REMINDER_JOB_NAME, data, {
    jobId: reminderJobId(data.bookingId),
    delay: Math.max(0, delayMs),
    ...REMINDER_JOB_OPTIONS,
  });
  logger.info(`Reminder job scheduled for booking ${data.bookingId}`);
}

export async function removeReminderJob(bookingId: string): Promise<boolean> {
  const job = await getReminderQueue().getJob(reminderJobId(bookingId));
  if (!job) {
    return false;
  }
  await job.remove();
  logger.info(`Reminder job removed for booking ${bookingId}`);
  return true;
}

export async function getReminderJobState(bookingId: string): Promise<{
  exists: boolean;
  state?: string;
}> {
  const job = await getReminderQueue().getJob(reminderJobId(bookingId));
  if (!job) {
    return { exists: false };
  }
  const state = await job.getState();
  return { exists: true, state };
}
