import { beforeEach, describe, expect, it, vi } from 'vitest';

const addReminderJob = vi.fn();
const removeReminderJob = vi.fn();
const getReminderJobState = vi.fn();
const sendBookingConfirmation = vi.fn();
const sendCancellation = vi.fn();

vi.mock('../../../src/queues/reminder.queue', () => ({
  addReminderJob: (...args: unknown[]) => addReminderJob(...args),
  removeReminderJob: (...args: unknown[]) => removeReminderJob(...args),
  getReminderJobState: (...args: unknown[]) => getReminderJobState(...args),
}));

vi.mock('../../../src/services/email.service', () => ({
  emailService: {
    sendBookingConfirmation: (...args: unknown[]) => sendBookingConfirmation(...args),
    sendCancellation: (...args: unknown[]) => sendCancellation(...args),
    sendBookingReminder: vi.fn(),
  },
}));

import { ReminderService, reminderDelayMs } from '../../../src/services/reminder.service';
import { makeBooking } from '../../fixtures/bookings';

describe('ReminderService (unit, queue mocked)', () => {
  const service = new ReminderService();
  const booking = makeBooking();

  beforeEach(() => {
    addReminderJob.mockReset().mockResolvedValue(undefined);
    removeReminderJob.mockReset().mockResolvedValue(true);
    getReminderJobState.mockReset().mockResolvedValue({ exists: false });
    sendBookingConfirmation.mockReset().mockResolvedValue(undefined);
    sendCancellation.mockReset().mockResolvedValue(undefined);
  });

  it('schedules by removing any existing job then adding one with the booking id', async () => {
    await service.schedule(booking);
    expect(removeReminderJob).toHaveBeenCalledWith(booking.bookingId);
    expect(addReminderJob).toHaveBeenCalledTimes(1);
    const [payload, delay] = addReminderJob.mock.calls[0];
    expect(payload.bookingId).toBe(booking.bookingId);
    expect(payload.userEmail).toBe('ada@company.com');
    expect(Math.abs(delay - reminderDelayMs(booking.startTime))).toBeLessThan(50);
    expect(removeReminderJob.mock.invocationCallOrder[0]).toBeLessThan(
      addReminderJob.mock.invocationCallOrder[0],
    );
    expect(sendBookingConfirmation).toHaveBeenCalled();
  });

  it('prevents duplicates by replacing the job on a second schedule', async () => {
    await service.schedule(booking);
    await service.schedule(booking);
    expect(removeReminderJob).toHaveBeenCalledTimes(2);
    expect(addReminderJob).toHaveBeenCalledTimes(2);
    expect(addReminderJob.mock.calls[0][0].bookingId).toBe(booking.bookingId);
    expect(addReminderJob.mock.calls[1][0].bookingId).toBe(booking.bookingId);
  });

  it('reschedules without sending another confirmation', async () => {
    await service.reschedule(booking);
    expect(removeReminderJob).toHaveBeenCalledWith(booking.bookingId);
    expect(addReminderJob).toHaveBeenCalledTimes(1);
    expect(sendBookingConfirmation).not.toHaveBeenCalled();
    expect(sendCancellation).not.toHaveBeenCalled();
  });

  it('cancels by removing the job and sending a cancellation email', async () => {
    await service.cancel(booking);
    expect(removeReminderJob).toHaveBeenCalledWith(booking.bookingId);
    expect(addReminderJob).not.toHaveBeenCalled();
    expect(sendCancellation).toHaveBeenCalled();
  });

  it('unschedules by removing the job without email', async () => {
    await service.unschedule(booking);
    expect(removeReminderJob).toHaveBeenCalledWith(booking.bookingId);
    expect(sendCancellation).not.toHaveBeenCalled();
    expect(sendBookingConfirmation).not.toHaveBeenCalled();
  });

  it('does not claim a job was added when enqueue fails', async () => {
    addReminderJob.mockRejectedValue(new Error('Redis unavailable'));
    await expect(service.schedule(booking)).rejects.toThrow(/Redis unavailable/);
    expect(sendBookingConfirmation).not.toHaveBeenCalled();
  });

  it('does not schedule a reminder when startTime is already past', async () => {
    const past = makeBooking({
      startTime: new Date(Date.now() - 60_000),
      endTime: new Date(Date.now() - 30_000),
    });
    await service.schedule(past);
    expect(removeReminderJob).toHaveBeenCalled();
    expect(addReminderJob).not.toHaveBeenCalled();
  });

  it('queues an immediate job when the booking is inside the lead window', async () => {
    const soon = makeBooking({
      startTime: new Date(Date.now() + 5 * 60_000),
      endTime: new Date(Date.now() + 20 * 60_000),
    });
    await service.schedule(soon);
    const delay = addReminderJob.mock.calls[0][1] as number;
    expect(delay).toBeLessThan(0);
  });

  it('reschedules a 10:00 booking to 14:00 by replacing the single job', async () => {
    const ten = makeBooking({ startTime: new Date('2030-01-01T10:00:00.000Z') });
    const fourteen = makeBooking({ startTime: new Date('2030-01-01T14:00:00.000Z') });
    await service.schedule(ten);
    await service.reschedule(fourteen);
    expect(removeReminderJob).toHaveBeenCalledTimes(2);
    expect(addReminderJob).toHaveBeenCalledTimes(2);
    expect(addReminderJob.mock.calls[1][0].startTime).toBe('2030-01-01T14:00:00.000Z');
    expect(addReminderJob.mock.calls[1][0].bookingId).toBe(ten.bookingId);
  });
});
