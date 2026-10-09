import { afterEach, describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { BookingService } from '../../../src/services/booking.service';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { ForbiddenError, NotFoundError } from '../../../src/utils/errors';
import { makeBooking } from '../../fixtures/bookings';
import { BOOKING_ID, OTHER_USER_ID, USER_ID } from '../../fixtures/ids';

describe('BookingService access rules (integration)', () => {
  const originalFind = BookingRepository.prototype.findById;

  afterEach(() => {
    BookingRepository.prototype.findById = originalFind;
  });

  it('getBookingById throws NotFoundError when missing', async () => {
    BookingRepository.prototype.findById = async () => null;
    await expect(
      new BookingService().getBookingById(BOOKING_ID, USER_ID, Role.EMPLOYEE),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('getBookingById forbids an employee from reading someone else\'s booking', async () => {
    BookingRepository.prototype.findById = async () => makeBooking({ userId: OTHER_USER_ID }) as any;
    await expect(
      new BookingService().getBookingById(BOOKING_ID, USER_ID, Role.EMPLOYEE),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('getBookingById allows an admin to read any booking', async () => {
    BookingRepository.prototype.findById = async () => makeBooking({ userId: OTHER_USER_ID }) as any;
    const booking = await new BookingService().getBookingById(BOOKING_ID, USER_ID, Role.ADMIN);
    expect(booking.bookingId).toBe(BOOKING_ID);
  });
});
