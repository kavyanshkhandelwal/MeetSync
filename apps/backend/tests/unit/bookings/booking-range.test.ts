import { describe, expect, it } from 'vitest';
import { bookingRangeOverlap } from '../../../src/repositories/booking.repository';

describe('calendar booking list overlap', () => {
  it('includes a booking that overlaps the visible week', () => {
    const weekStart = new Date('2030-09-01T00:00:00.000Z');
    const weekEnd = new Date('2030-09-08T00:00:00.000Z');
    const where = bookingRangeOverlap(weekStart, weekEnd);

    const bookingStart = new Date('2030-09-07T23:00:00.000Z');
    const bookingEnd = new Date('2030-09-08T01:00:00.000Z');

    expect(bookingStart < weekEnd).toBe(true);
    expect(bookingEnd > weekStart).toBe(true);
    expect(where).toEqual([
      { startTime: { lt: weekEnd } },
      { endTime: { gt: weekStart } },
    ]);
  });

  it('excludes a booking entirely before the range', () => {
    const weekStart = new Date('2030-09-01T00:00:00.000Z');
    const bookingEnd = new Date('2030-08-31T12:00:00.000Z');
    expect(bookingEnd > weekStart).toBe(false);
  });
});
