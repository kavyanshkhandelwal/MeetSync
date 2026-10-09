import { describe, expect, it } from 'vitest';
import { BookingStatus, Role } from '@prisma/client';
import { BadRequestError, ForbiddenError } from '../../../src/utils/errors';
import {
  BOOKING_STATUS_TRANSITIONS,
  assertBookingStatusTransition,
  canTransitionBookingStatus,
  isTerminalBookingStatus,
} from '../../../src/domain/bookingStatus.machine';

describe('BookingStatus state machine (unit)', () => {
  it('allows only the documented edges', () => {
    expect(BOOKING_STATUS_TRANSITIONS[BookingStatus.PENDING]).toEqual([
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
    ]);
    expect(BOOKING_STATUS_TRANSITIONS[BookingStatus.CONFIRMED]).toEqual([
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
    ]);
    expect(BOOKING_STATUS_TRANSITIONS[BookingStatus.CANCELLED]).toEqual([]);
    expect(BOOKING_STATUS_TRANSITIONS[BookingStatus.COMPLETED]).toEqual([]);
  });

  it('treats identity as a no-op', () => {
    for (const status of Object.values(BookingStatus)) {
      expect(canTransitionBookingStatus(status, status)).toBe(true);
    }
  });

  it('rejects CANCELLED → CONFIRMED', () => {
    expect(canTransitionBookingStatus(BookingStatus.CANCELLED, BookingStatus.CONFIRMED)).toBe(false);
    expect(() =>
      assertBookingStatusTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED, Role.ADMIN),
    ).toThrow(BadRequestError);
  });

  it('rejects COMPLETED → CONFIRMED', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.COMPLETED, BookingStatus.CONFIRMED, Role.ADMIN),
    ).toThrow(BadRequestError);
  });

  it('rejects COMPLETED → CANCELLED', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.COMPLETED, BookingStatus.CANCELLED, Role.ADMIN),
    ).toThrow(BadRequestError);
  });

  it('rejects CANCELLED → COMPLETED', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.CANCELLED, BookingStatus.COMPLETED, Role.ADMIN),
    ).toThrow(BadRequestError);
  });

  it('rejects CONFIRMED → PENDING and PENDING → COMPLETED', () => {
    expect(canTransitionBookingStatus(BookingStatus.CONFIRMED, BookingStatus.PENDING)).toBe(false);
    expect(canTransitionBookingStatus(BookingStatus.PENDING, BookingStatus.COMPLETED)).toBe(false);
  });

  it('allows PENDING → CONFIRMED for admin only', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED, Role.ADMIN),
    ).not.toThrow();
    expect(() =>
      assertBookingStatusTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED, Role.EMPLOYEE),
    ).toThrow(ForbiddenError);
  });

  it('allows PENDING → CANCELLED and CONFIRMED → CANCELLED for employees', () => {
    expect(() =>
      assertBookingStatusTransition(BookingStatus.PENDING, BookingStatus.CANCELLED, Role.EMPLOYEE),
    ).not.toThrow();
    expect(() =>
      assertBookingStatusTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED, Role.EMPLOYEE),
    ).not.toThrow();
  });

  it('marks CANCELLED and COMPLETED as terminal', () => {
    expect(isTerminalBookingStatus(BookingStatus.CANCELLED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.COMPLETED)).toBe(true);
    expect(isTerminalBookingStatus(BookingStatus.PENDING)).toBe(false);
    expect(isTerminalBookingStatus(BookingStatus.CONFIRMED)).toBe(false);
  });
});
