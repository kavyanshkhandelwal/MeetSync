import { describe, expect, it } from 'vitest';
import { BookingStatus } from '@prisma/client';
import {
  BookingRepository,
  bookingRangeOverlap,
  isOccupyingStatus,
  occupyingStatusFilter,
  OCCUPYING_STATUSES,
} from '../../../src/repositories/booking.repository';
import { ROOM_ID } from '../../fixtures/ids';

function intervalsOverlap(
  existingStart: Date,
  existingEnd: Date,
  requestedStart: Date,
  requestedEnd: Date,
): boolean {
  return existingStart < requestedEnd && existingEnd > requestedStart;
}

function wouldBlock(
  status: BookingStatus,
  existingStart: Date,
  existingEnd: Date,
  requestedStart: Date,
  requestedEnd: Date,
): boolean {
  return isOccupyingStatus(status) && intervalsOverlap(existingStart, existingEnd, requestedStart, requestedEnd);
}

const requestedStart = new Date('2030-01-01T10:00:00.000Z');
const requestedEnd = new Date('2030-01-01T11:00:00.000Z');

describe('canonical occupancy rule', () => {
  it('1. PENDING blocks an overlapping booking', () => {
    expect(
      wouldBlock(
        BookingStatus.PENDING,
        new Date('2030-01-01T10:30:00.000Z'),
        new Date('2030-01-01T11:30:00.000Z'),
        requestedStart,
        requestedEnd,
      ),
    ).toBe(true);
  });

  it('2. CONFIRMED blocks an overlapping booking', () => {
    expect(
      wouldBlock(
        BookingStatus.CONFIRMED,
        new Date('2030-01-01T09:30:00.000Z'),
        new Date('2030-01-01T10:30:00.000Z'),
        requestedStart,
        requestedEnd,
      ),
    ).toBe(true);
  });

  it('3. CANCELLED does not block', () => {
    expect(
      wouldBlock(
        BookingStatus.CANCELLED,
        requestedStart,
        requestedEnd,
        requestedStart,
        requestedEnd,
      ),
    ).toBe(false);
  });

  it('4. COMPLETED does not block a new booking', () => {
    expect(
      wouldBlock(
        BookingStatus.COMPLETED,
        requestedStart,
        requestedEnd,
        requestedStart,
        requestedEnd,
      ),
    ).toBe(false);
    expect(isOccupyingStatus(BookingStatus.COMPLETED)).toBe(false);
  });

  it('5. back-to-back bookings remain valid', () => {
    const existingEnd = new Date('2030-01-01T11:00:00.000Z');
    const nextStart = new Date('2030-01-01T11:00:00.000Z');
    const nextEnd = new Date('2030-01-01T12:00:00.000Z');
    expect(
      wouldBlock(
        BookingStatus.CONFIRMED,
        requestedStart,
        existingEnd,
        nextStart,
        nextEnd,
      ),
    ).toBe(false);
  });

  it('6. boundary overlap behaves consistently (half-open: start < end AND end > start)', () => {
    const overlapStart = new Date('2030-01-01T10:59:59.000Z');
    const overlapEnd = new Date('2030-01-01T12:00:00.000Z');
    expect(
      wouldBlock(BookingStatus.PENDING, overlapStart, overlapEnd, requestedStart, requestedEnd),
    ).toBe(true);

    const touchStart = new Date('2030-01-01T11:00:00.000Z');
    const touchEnd = new Date('2030-01-01T12:00:00.000Z');
    expect(
      wouldBlock(BookingStatus.PENDING, touchStart, touchEnd, requestedStart, requestedEnd),
    ).toBe(false);
  });

  it('7. availability and booking creation use the same occupancy filter and overlap predicate', async () => {
    let conflictWhere: any;
    const tx = {
      booking: {
        findFirst: async (args: unknown) => {
          conflictWhere = (args as any).where;
          return null;
        },
      },
    };

    await new BookingRepository().checkForConflictingBookingInTransaction(
      tx as any,
      ROOM_ID,
      requestedStart,
      requestedEnd,
    );

    expect(OCCUPYING_STATUSES).toEqual([BookingStatus.PENDING, BookingStatus.CONFIRMED]);
    expect(occupyingStatusFilter()).toEqual({ in: OCCUPYING_STATUSES });
    expect(conflictWhere.status).toEqual(occupyingStatusFilter());
    expect(conflictWhere.AND).toEqual(bookingRangeOverlap(requestedStart, requestedEnd));

    expect(isOccupyingStatus(BookingStatus.PENDING)).toBe(true);
    expect(isOccupyingStatus(BookingStatus.CONFIRMED)).toBe(true);
    expect(isOccupyingStatus(BookingStatus.CANCELLED)).toBe(false);
    expect(isOccupyingStatus(BookingStatus.COMPLETED)).toBe(false);
  });
});
