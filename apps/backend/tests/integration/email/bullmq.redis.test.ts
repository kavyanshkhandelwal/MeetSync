import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { BookingStatus } from '@prisma/client';
import { canReachRedis } from '../../helpers/redis.probe';
import {
  addReminderJob,
  closeReminderQueue,
  getReminderJobState,
  getReminderQueue,
  reminderJobId,
  removeReminderJob,
} from '../../../src/queues/reminder.queue';
import { startReminderWorker, stopReminderWorker } from '../../../src/workers/reminder.worker';
import { emailService } from '../../../src/services/email.service';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { makeBooking } from '../../fixtures/bookings';

const redisAvailable = await canReachRedis();

describe.skipIf(!redisAvailable)('BullMQ reminder queue (integration, requires Redis)', () => {
  const bookingId = `phase4c-${Date.now()}`;
  const originalFind = BookingRepository.prototype.findById;

  afterEach(() => {
    BookingRepository.prototype.findById = originalFind;
  });

  afterAll(async () => {
    await removeReminderJob(bookingId).catch(() => undefined);
    await removeReminderJob(`${bookingId}-now`).catch(() => undefined);
    await removeReminderJob(`${bookingId}-cancel`).catch(() => undefined);
    await stopReminderWorker();
    await closeReminderQueue();
  });

  it('creates a delayed job keyed by booking id', async () => {
    await addReminderJob(
      {
        bookingId,
        userEmail: 'ada@company.com',
        purpose: 'Queue integration',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      60_000,
    );
    const state = await getReminderJobState(bookingId);
    expect(state.exists).toBe(true);
    expect(state.state).toMatch(/delayed|waiting/);
    expect(reminderJobId(bookingId)).toBe(bookingId);
  });

  it('reschedules by replacing the 10:00 job with a single 14:00 job', async () => {
    await removeReminderJob(bookingId);
    await addReminderJob(
      {
        bookingId,
        userEmail: 'ada@company.com',
        purpose: 'Morning',
        startTime: '2030-01-01T10:00:00.000Z',
      },
      60_000,
    );
    await removeReminderJob(bookingId);
    await addReminderJob(
      {
        bookingId,
        userEmail: 'ada@company.com',
        purpose: 'Afternoon',
        startTime: '2030-01-01T14:00:00.000Z',
      },
      120_000,
    );
    const job = await getReminderQueue().getJob(bookingId);
    expect(job).toBeTruthy();
    expect(job?.data.startTime).toBe('2030-01-01T14:00:00.000Z');
    expect(job?.data.purpose).toBe('Afternoon');
  });

  it('removes the job so a cancelled booking cannot fire', async () => {
    const removed = await removeReminderJob(bookingId);
    expect(removed).toBe(true);
    const state = await getReminderJobState(bookingId);
    expect(state.exists).toBe(false);
  });

  it('worker sends a reminder for an occupying booking', async () => {
    const immediateId = `${bookingId}-now`;
    BookingRepository.prototype.findById = async () =>
      makeBooking({
        bookingId: immediateId,
        status: BookingStatus.PENDING,
        purpose: 'Immediate reminder',
      }) as any;
    emailService.clearOutbox();
    startReminderWorker();
    await addReminderJob(
      {
        bookingId: immediateId,
        userEmail: 'ada@company.com',
        purpose: 'Immediate reminder',
        startTime: new Date().toISOString(),
      },
      0,
    );

    const deadline = Date.now() + 8000;
    let seen = false;
    while (Date.now() < deadline) {
      seen = emailService.getOutbox().some((message) => message.html?.includes('Orion'));
      if (seen) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    await removeReminderJob(immediateId).catch(() => undefined);
    expect(seen).toBe(true);
  });

  it('worker does not send after the booking is cancelled even if a job remains', async () => {
    const cancelId = `${bookingId}-cancel`;
    BookingRepository.prototype.findById = async () =>
      makeBooking({ bookingId: cancelId, status: BookingStatus.CANCELLED }) as any;
    emailService.clearOutbox();
    startReminderWorker();
    await addReminderJob(
      {
        bookingId: cancelId,
        userEmail: 'ada@company.com',
        purpose: 'Should not remind',
        startTime: new Date().toISOString(),
      },
      0,
    );

    await new Promise((resolve) => setTimeout(resolve, 1500));
    const leaked = emailService
      .getOutbox()
      .some((message) => message.text.includes('Should not remind'));
    await removeReminderJob(cancelId).catch(() => undefined);
    expect(leaked).toBe(false);
  });
});
