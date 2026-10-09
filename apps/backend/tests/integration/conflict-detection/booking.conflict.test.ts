import { afterEach, describe, expect, it } from 'vitest';
import { RoomStatus } from '@prisma/client';
import { BookingService } from '../../../src/services/booking.service';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { BadRequestError, ConflictError, NotFoundError } from '../../../src/utils/errors';
import { makeRoom } from '../../fixtures/rooms';
import { makeBooking } from '../../fixtures/bookings';
import { ROOM_ID, USER_ID } from '../../fixtures/ids';

const input = {
  roomId: ROOM_ID,
  startTime: new Date('2030-01-01T10:00:00.000Z'),
  endTime: new Date('2030-01-01T11:00:00.000Z'),
  purpose: 'Conflict check',
};

describe('BookingService conflict mapping (integration)', () => {
  const originalRoomFind = RoomRepository.prototype.findById;
  const originalCreateTx = BookingRepository.prototype.createBookingInTransaction;

  afterEach(() => {
    RoomRepository.prototype.findById = originalRoomFind;
    BookingRepository.prototype.createBookingInTransaction = originalCreateTx;
  });

  it('throws NotFoundError when the room does not exist', async () => {
    RoomRepository.prototype.findById = async () => null;
    await expect(new BookingService().createBooking(input as any, USER_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws BadRequestError when the room is not ACTIVE', async () => {
    RoomRepository.prototype.findById = async () =>
      makeRoom({ status: RoomStatus.MAINTENANCE }) as any;
    await expect(new BookingService().createBooking(input as any, USER_ID)).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('maps repository overlap errors to ConflictError', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.createBookingInTransaction = async () => {
      throw new Error('Room is already booked for the selected time slot');
    };
    await expect(new BookingService().createBooking(input as any, USER_ID)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('returns the created booking when the transaction succeeds', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.createBookingInTransaction = async () => makeBooking() as any;
    const booking = await new BookingService().createBooking(input as any, USER_ID);
    expect(booking.roomId).toBe(ROOM_ID);
    expect(booking.status).toBe('PENDING');
  });
});
