import { describe, expect, it } from 'vitest';
import { BookingStatus } from '@prisma/client';
import {
  BookingRepository,
  bookingRangeOverlap,
  occupyingStatusFilter,
} from '../../../src/repositories/booking.repository';
import { BOOKING_ID, ROOM_ID } from '../../fixtures/ids';

describe('conflict query shape', () => {
  it('looks for overlapping PENDING/CONFIRMED bookings on the same room', async () => {
    let captured: any;
    const tx = {
      booking: {
        findFirst: async (args: unknown) => {
          captured = args;
          return null;
        },
      },
    };

    const start = new Date('2030-01-01T10:00:00.000Z');
    const end = new Date('2030-01-01T11:00:00.000Z');
    await new BookingRepository().checkForConflictingBookingInTransaction(
      tx as any,
      ROOM_ID,
      start,
      end,
      BOOKING_ID,
    );

    expect(captured.where.roomId).toBe(ROOM_ID);
    expect(captured.where.status).toEqual(occupyingStatusFilter());
    expect(captured.where.status.in).toEqual([BookingStatus.PENDING, BookingStatus.CONFIRMED]);
    expect(captured.where.bookingId).toEqual({ not: BOOKING_ID });
    expect(captured.where.AND).toEqual(bookingRangeOverlap(start, end));
  });

  it('does not exclude a booking id on create-style checks', async () => {
    let captured: any;
    const tx = {
      booking: {
        findFirst: async (args: unknown) => {
          captured = args;
          return null;
        },
      },
    };

    await new BookingRepository().checkForConflictingBookingInTransaction(
      tx as any,
      ROOM_ID,
      new Date('2030-01-01T10:00:00.000Z'),
      new Date('2030-01-01T11:00:00.000Z'),
    );

    expect(captured.where.bookingId).toBeUndefined();
  });
});
