import { afterEach, describe, expect, it } from 'vitest';
import { BookingStatus, Role } from '@prisma/client';
import { BookingService } from '../../../src/services/booking.service';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { BadRequestError, ForbiddenError } from '../../../src/utils/errors';
import { makeBooking } from '../../fixtures/bookings';
import { BOOKING_ID, USER_ID } from '../../fixtures/ids';

describe('BookingService status transitions (integration)', () => {
  const originalFind = BookingRepository.prototype.findById;
  const originalUpdate = BookingRepository.prototype.update;
  const originalUpdateTx = BookingRepository.prototype.updateBookingInTransaction;

  afterEach(() => {
    BookingRepository.prototype.findById = originalFind;
    BookingRepository.prototype.update = originalUpdate;
    BookingRepository.prototype.updateBookingInTransaction = originalUpdateTx;
  });

  function stubFind(status: BookingStatus) {
    BookingRepository.prototype.findById = async () => makeBooking({ status }) as any;
    BookingRepository.prototype.update = async (_id, data) =>
      ({ ...makeBooking({ status }), ...data }) as any;
  }

  it('rejects CANCELLED → CONFIRMED via update', async () => {
    stubFind(BookingStatus.CANCELLED);
    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        { status: BookingStatus.CONFIRMED },
        USER_ID,
        Role.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects COMPLETED → CONFIRMED via update', async () => {
    stubFind(BookingStatus.COMPLETED);
    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        { status: BookingStatus.CONFIRMED },
        USER_ID,
        Role.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects COMPLETED → CANCELLED via cancel', async () => {
    stubFind(BookingStatus.COMPLETED);
    await expect(
      new BookingService().cancelBooking(BOOKING_ID, USER_ID, Role.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects CANCELLED → COMPLETED via update', async () => {
    stubFind(BookingStatus.CANCELLED);
    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        { status: BookingStatus.COMPLETED },
        USER_ID,
        Role.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects CONFIRMED → PENDING via update (was previously possible for admin)', async () => {
    stubFind(BookingStatus.CONFIRMED);
    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        { status: BookingStatus.PENDING },
        USER_ID,
        Role.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects PENDING → COMPLETED via update', async () => {
    stubFind(BookingStatus.PENDING);
    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        { status: BookingStatus.COMPLETED },
        USER_ID,
        Role.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('allows PENDING → CONFIRMED for admin', async () => {
    stubFind(BookingStatus.PENDING);
    const result = await new BookingService().updateBooking(
      BOOKING_ID,
      { status: BookingStatus.CONFIRMED },
      USER_ID,
      Role.ADMIN,
    );
    expect(result.status).toBe(BookingStatus.CONFIRMED);
  });

  it('forbids PENDING → CONFIRMED for employee', async () => {
    stubFind(BookingStatus.PENDING);
    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        { status: BookingStatus.CONFIRMED },
        USER_ID,
        Role.EMPLOYEE,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows PENDING → CANCELLED via cancelBooking', async () => {
    stubFind(BookingStatus.PENDING);
    const result = await new BookingService().cancelBooking(BOOKING_ID, USER_ID, Role.EMPLOYEE);
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('allows CONFIRMED → COMPLETED for admin', async () => {
    stubFind(BookingStatus.CONFIRMED);
    const result = await new BookingService().updateBooking(
      BOOKING_ID,
      { status: BookingStatus.COMPLETED },
      USER_ID,
      Role.ADMIN,
    );
    expect(result.status).toBe(BookingStatus.COMPLETED);
  });
});
