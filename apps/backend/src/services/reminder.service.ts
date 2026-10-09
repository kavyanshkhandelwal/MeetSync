import { Booking } from '@prisma/client';
import { emailService } from './email.service';
import { env } from '../config';
import {
  addReminderJob,
  getReminderJobState,
  removeReminderJob,
} from '../queues/reminder.queue';
import { logger } from '../utils/logger';

export const REMINDER_LEAD_MS = env.REMINDER_LEAD_MINUTES * 60 * 1000;

function recipient(booking: any): string {
  return booking.user?.email || booking.userEmail || '';
}

export function reminderDelayMs(startTime: Date | string, now = Date.now()): number {
  return new Date(startTime).getTime() - now - REMINDER_LEAD_MS;
}

/** Past bookings are not scheduled. Near-term bookings still get a delay-0 job. */
export function shouldScheduleReminder(startTime: Date | string, now = Date.now()): boolean {
  return new Date(startTime).getTime() > now;
}

function mailPayload(booking: any) {
  return {
    bookingId: booking.bookingId,
    purpose: booking.purpose,
    startTime: new Date(booking.startTime),
    endTime: booking.endTime ? new Date(booking.endTime) : undefined,
    roomName: booking.room?.name,
    status: booking.status,
  };
}

export class ReminderService {
  async schedule(booking: Booking | any): Promise<void> {
    await this.replaceJob(booking);
    try {
      await emailService.sendBookingConfirmation(recipient(booking), mailPayload(booking));
    } catch (err) {
      logger.error('Confirmation email failed:', err instanceof Error ? err.message : err);
    }
  }

  async reschedule(booking: Booking | any): Promise<void> {
    await this.replaceJob(booking);
  }

  async cancel(booking: Booking | any): Promise<void> {
    await this.unschedule(booking);
    try {
      await emailService.sendCancellation(recipient(booking), {
        ...mailPayload(booking),
        status: 'CANCELLED',
      });
    } catch (err) {
      logger.error('Cancellation email failed:', err instanceof Error ? err.message : err);
    }
  }

  async unschedule(booking: Booking | any): Promise<void> {
    await removeReminderJob(booking.bookingId);
  }

  async status(bookingId: string) {
    return getReminderJobState(bookingId);
  }

  private async replaceJob(booking: Booking | any): Promise<void> {
    await removeReminderJob(booking.bookingId);
    if (!shouldScheduleReminder(booking.startTime)) {
      logger.info(`Reminder not scheduled for ${booking.bookingId}: startTime is in the past`);
      return;
    }
    await addReminderJob(
      {
        bookingId: booking.bookingId,
        userEmail: recipient(booking),
        purpose: booking.purpose,
        startTime: new Date(booking.startTime).toISOString(),
        endTime: booking.endTime ? new Date(booking.endTime).toISOString() : undefined,
        roomName: booking.room?.name,
        status: booking.status,
      },
      reminderDelayMs(booking.startTime),
    );
  }
}

export const reminderService = new ReminderService();
