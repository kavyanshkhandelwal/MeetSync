import { BookingStatus } from '@prisma/client';
import { BookingRepository, isOccupyingStatus } from '../repositories/booking.repository';
import type { ReminderJobData } from '../queues/reminder.queue';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

export type ReminderProcessResult = 'sent' | 'skipped';

const bookingRepository = new BookingRepository();

/**
 * Worker-side gate: a cancelled/deleted/completed booking must never receive
 * the original reminder even if a stale job is still in Redis.
 */
export async function processReminderJob(
  data: ReminderJobData,
  deps: {
    findById?: (id: string) => Promise<any | null>;
    sendReminder?: typeof emailService.sendBookingReminder;
  } = {},
): Promise<ReminderProcessResult> {
  const findById = deps.findById ?? ((id: string) => bookingRepository.findById(id));
  const sendReminder = deps.sendReminder ?? ((to, booking) => emailService.sendBookingReminder(to, booking));

  const booking = await findById(data.bookingId);
  if (!booking) {
    logger.info(`Reminder skipped for ${data.bookingId}: booking not found`);
    return 'skipped';
  }

  if (!isOccupyingStatus(booking.status as BookingStatus)) {
    logger.info(`Reminder skipped for ${data.bookingId}: status=${booking.status}`);
    return 'skipped';
  }

  await sendReminder(data.userEmail || booking.user?.email, {
    bookingId: booking.bookingId,
    purpose: booking.purpose,
    startTime: new Date(booking.startTime),
    endTime: new Date(booking.endTime),
    roomName: booking.room?.name,
    status: booking.status,
  });
  return 'sent';
}
