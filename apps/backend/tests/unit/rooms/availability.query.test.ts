import { describe, expect, it } from 'vitest';
import { BookingStatus } from '@prisma/client';
import {
  bookingRangeOverlap,
  isOccupyingStatus,
  OCCUPYING_STATUSES,
} from '../../../src/repositories/booking.repository';

describe('bookingRangeOverlap', () => {
  const start = new Date('2030-01-01T00:00:00.000Z');
  const end = new Date('2030-01-08T00:00:00.000Z');

  it('uses start < requestedEnd AND end > requestedStart', () => {
    expect(bookingRangeOverlap(start, end)).toEqual([
      { startTime: { lt: end } },
      { endTime: { gt: start } },
    ]);
  });

  it('supports an open start bound', () => {
    expect(bookingRangeOverlap(undefined, end)).toEqual([{ startTime: { lt: end } }]);
  });
});

describe('availability occupying statuses', () => {
  it('treats only PENDING and CONFIRMED as occupying', () => {
    expect(OCCUPYING_STATUSES).toEqual([BookingStatus.PENDING, BookingStatus.CONFIRMED]);
    expect(isOccupyingStatus(BookingStatus.CANCELLED)).toBe(false);
    expect(isOccupyingStatus(BookingStatus.COMPLETED)).toBe(false);
  });
});
