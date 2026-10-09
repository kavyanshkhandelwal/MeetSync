import { describe, expect, it } from 'vitest';
import { formatBookingSchedule } from '../../../src/templates/formatBookingTime';
import {
  bookingCancellationMail,
  bookingConfirmationMail,
  bookingReminderMail,
} from '../../../src/templates/bookingMail';

const fields = {
  bookingId: 'b1',
  purpose: 'Architecture review',
  roomName: 'Orion',
  status: 'PENDING',
  date: '1 January 2030',
  startTime: '10:00',
  endTime: '11:00',
  timeZone: 'UTC',
};

describe('booking email templates', () => {
  it('formats start and end in a single timezone', () => {
    const schedule = formatBookingSchedule(
      new Date('2030-01-01T10:00:00.000Z'),
      new Date('2030-01-01T11:00:00.000Z'),
      'UTC',
    );
    expect(schedule.date).toContain('2030');
    expect(schedule.startTime).toBe('10:00');
    expect(schedule.endTime).toBe('11:00');
    expect(schedule.timeZone).toBe('UTC');
    expect(schedule.range).toContain('10:00–11:00 UTC');
  });

  it('includes room, date, times, purpose, and status in confirmation, reminder, and cancellation', () => {
    for (const mail of [
      bookingConfirmationMail(fields),
      bookingReminderMail(fields),
      bookingCancellationMail({ ...fields, status: 'CANCELLED' }),
    ]) {
      expect(mail.text).toContain('Orion');
      expect(mail.text).toContain('1 January 2030');
      expect(mail.text).toContain('10:00 UTC');
      expect(mail.text).toContain('11:00 UTC');
      expect(mail.text).toContain('Architecture review');
      expect(mail.html).toContain('Orion');
      expect(mail.html).toContain('Architecture review');
    }
    expect(bookingCancellationMail({ ...fields, status: 'CANCELLED' }).text).toContain('CANCELLED');
  });
});
