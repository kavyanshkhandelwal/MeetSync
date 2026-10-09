import { describe, expect, it, vi } from 'vitest';
import { BookingStatus } from '@prisma/client';
import { processReminderJob } from '../../../src/services/reminder.processor';
import { makeBooking } from '../../fixtures/bookings';
import { BOOKING_ID } from '../../fixtures/ids';

const job = {
  bookingId: BOOKING_ID,
  userEmail: 'ada@company.com',
  purpose: 'Architecture review',
  startTime: '2030-01-01T10:00:00.000Z',
};

describe('processReminderJob (worker gate)', () => {
  it('sends a reminder for an occupying booking', async () => {
    const sendReminder = vi.fn().mockResolvedValue(undefined);
    const result = await processReminderJob(job, {
      findById: async () => makeBooking({ status: BookingStatus.PENDING }),
      sendReminder,
    });
    expect(result).toBe('sent');
    expect(sendReminder).toHaveBeenCalledTimes(1);
    expect(sendReminder.mock.calls[0][0]).toBe('ada@company.com');
  });

  it('never sends the original reminder after cancellation', async () => {
    const sendReminder = vi.fn();
    const result = await processReminderJob(job, {
      findById: async () => makeBooking({ status: BookingStatus.CANCELLED }),
      sendReminder,
    });
    expect(result).toBe('skipped');
    expect(sendReminder).not.toHaveBeenCalled();
  });

  it('skips completed and missing bookings', async () => {
    const sendReminder = vi.fn();
    await expect(
      processReminderJob(job, {
        findById: async () => makeBooking({ status: BookingStatus.COMPLETED }),
        sendReminder,
      }),
    ).resolves.toBe('skipped');
    await expect(
      processReminderJob(job, {
        findById: async () => null,
        sendReminder,
      }),
    ).resolves.toBe('skipped');
    expect(sendReminder).not.toHaveBeenCalled();
  });

  it('fails the job when the email transport throws so BullMQ can retry', async () => {
    const sendReminder = vi.fn().mockRejectedValue(new Error('SMTP 421 temporary'));
    await expect(
      processReminderJob(job, {
        findById: async () => makeBooking({ status: BookingStatus.CONFIRMED }),
        sendReminder,
      }),
    ).rejects.toThrow(/SMTP 421/);
  });
});
