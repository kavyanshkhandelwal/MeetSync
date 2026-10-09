import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { createWorkerRedisConnection, disconnectRedis } from '../config/redis';
import { REMINDER_QUEUE_NAME, ReminderJobData } from '../queues/reminder.queue';
import { processReminderJob } from '../services/reminder.processor';
import { logger } from '../utils/logger';

let worker: Worker<ReminderJobData> | null = null;
let connection: IORedis | null = null;

export function startReminderWorker(): Worker<ReminderJobData> {
  if (worker) {
    return worker;
  }

  connection = createWorkerRedisConnection();
  worker = new Worker<ReminderJobData>(
    REMINDER_QUEUE_NAME,
    async (job) => {
      const result = await processReminderJob(job.data);
      if (result === 'skipped') {
        logger.info(`Reminder job ${job.id} completed without sending`);
      }
    },
    { connection },
  );

  worker.on('completed', (job) => {
    logger.info(`Reminder worker completed job ${job.id}`);
  });
  worker.on('failed', (job, err) => {
    logger.error(`Reminder worker failed job ${job?.id}:`, err.message);
  });

  logger.info(`BullMQ reminder worker started (queue=${REMINDER_QUEUE_NAME})`);
  return worker;
}

export async function stopReminderWorker(): Promise<void> {
  if (worker) {
    try {
      await worker.close();
    } catch (err) {
      logger.warn('Reminder worker close failed:', err instanceof Error ? err.message : err);
    }
    worker = null;
  }
  await disconnectRedis(connection);
  connection = null;
}

if (require.main === module) {
  startReminderWorker();
  const shutdown = async () => {
    logger.info('Reminder worker shutting down');
    await stopReminderWorker();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
