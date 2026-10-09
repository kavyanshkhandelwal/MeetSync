import { describe, expect, it } from 'vitest';
import { BookingStatus } from '@prisma/client';
import {
  CreateBookingSchema,
  UpdateBookingSchema,
} from '../../../src/validators/booking.validator';
import { ROOM_ID } from '../../fixtures/ids';

function offsetIso(date: Date): string {
  return date.toISOString().replace('Z', '+00:00');
}

describe('CreateBookingSchema', () => {
  const start = new Date('2030-06-01T10:00:00.000Z');
  const end = new Date('2030-06-01T11:00:00.000Z');

  const valid = {
    roomId: ROOM_ID,
    startTime: offsetIso(start),
    endTime: offsetIso(end),
    purpose: 'Planning session',
  };

  it('accepts a future 60-minute booking', () => {
    const parsed = CreateBookingSchema.parse(valid);
    expect(parsed.roomId).toBe(ROOM_ID);
    expect(parsed.startTime.getTime()).toBe(start.getTime());
  });

  it('rejects end before start', () => {
    const result = CreateBookingSchema.safeParse({
      ...valid,
      startTime: offsetIso(end),
      endTime: offsetIso(start),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a booking shorter than 15 minutes', () => {
    const result = CreateBookingSchema.safeParse({
      ...valid,
      endTime: offsetIso(new Date(start.getTime() + 5 * 60_000)),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a booking longer than 8 hours', () => {
    const result = CreateBookingSchema.safeParse({
      ...valid,
      endTime: offsetIso(new Date(start.getTime() + 9 * 3600_000)),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a start time in the past', () => {
    const result = CreateBookingSchema.safeParse({
      ...valid,
      startTime: offsetIso(new Date('2020-01-01T10:00:00.000Z')),
      endTime: offsetIso(new Date('2020-01-01T11:00:00.000Z')),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateBookingSchema', () => {
  it('accepts a status-only payload including any enum value', () => {
    const parsed = UpdateBookingSchema.parse({ status: BookingStatus.COMPLETED });
    expect(parsed.status).toBe(BookingStatus.COMPLETED);
  });
});
