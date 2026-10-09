import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingStatus, Role } from '@prisma/client';
import { BookingService } from '../../../src/services/booking.service';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { reminderService } from '../../../src/services/reminder.service';
import { makeBooking } from '../../fixtures/bookings';
import { makeRoom } from '../../fixtures/rooms';
import { BOOKING_ID, USER_ID } from '../../fixtures/ids';

const room = makeRoom({ name: 'Mail Room', capacity: 4, floor: 1 });
const booking = makeBooking({
  purpose: 'Email reminder lifecycle test',
  startTime: new Date('2030-06-01T10:00:00.000Z'),
  endTime: new Date('2030-06-01T11:00:00.000Z'),
  room,
  user: { userId: USER_ID, email: 'tester@company.com', role: Role.EMPLOYEE },
});
const createInput = {
  roomId: booking.roomId,
  startTime: booking.startTime,
  endTime: booking.endTime,
  purpose: booking.purpose,
};

describe('Email / reminder lifecycle (integration against real BookingService)', () => {
  const originalRoomFind = RoomRepository.prototype.findById;
  const originalCreateTx = BookingRepository.prototype.createBookingInTransaction;
  const originalFindById = BookingRepository.prototype.findById;
  const originalUpdateTx = BookingRepository.prototype.updateBookingInTransaction;
  const originalUpdate = BookingRepository.prototype.update;
  const originalDelete = BookingRepository.prototype.delete;

  afterEach(() => {
    RoomRepository.prototype.findById = originalRoomFind;
    BookingRepository.prototype.createBookingInTransaction = originalCreateTx;
    BookingRepository.prototype.findById = originalFindById;
    BookingRepository.prototype.updateBookingInTransaction = originalUpdateTx;
    BookingRepository.prototype.update = originalUpdate;
    BookingRepository.prototype.delete = originalDelete;
    vi.restoreAllMocks();
  });

  it('schedules a reminder when a booking is created', async () => {
    const schedule = vi.spyOn(reminderService, 'schedule').mockResolvedValue();
    RoomRepository.prototype.findById = async () => room as any;
    BookingRepository.prototype.createBookingInTransaction = async () => booking as any;
    await new BookingService().createBooking(createInput as any, USER_ID);
    expect(schedule).toHaveBeenCalled();
  });

  it('cancels the reminder when a booking is cancelled', async () => {
    const cancel = vi.spyOn(reminderService, 'cancel').mockResolvedValue();
    BookingRepository.prototype.findById = async () => booking as any;
    BookingRepository.prototype.update = async () =>
      ({ ...booking, status: BookingStatus.CANCELLED }) as any;
    await new BookingService().cancelBooking(BOOKING_ID, USER_ID, Role.EMPLOYEE);
    expect(cancel).toHaveBeenCalled();
  });

  it('unschedules the reminder when a booking is deleted', async () => {
    const unschedule = vi.spyOn(reminderService, 'unschedule').mockResolvedValue();
    BookingRepository.prototype.findById = async () => booking as any;
    BookingRepository.prototype.delete = async () => undefined;
    await new BookingService().deleteBooking(BOOKING_ID, USER_ID, Role.EMPLOYEE);
    expect(unschedule).toHaveBeenCalled();
  });

  it('unschedules the reminder when a booking is completed', async () => {
    const unschedule = vi.spyOn(reminderService, 'unschedule').mockResolvedValue();
    BookingRepository.prototype.findById = async () =>
      ({ ...booking, status: BookingStatus.CONFIRMED }) as any;
    BookingRepository.prototype.update = async () =>
      ({ ...booking, status: BookingStatus.COMPLETED }) as any;
    await new BookingService().updateBooking(
      BOOKING_ID,
      { status: BookingStatus.COMPLETED } as any,
      USER_ID,
      Role.ADMIN,
    );
    expect(unschedule).toHaveBeenCalled();
  });

  it('reschedules the reminder when booking time changes', async () => {
    const reschedule = vi.spyOn(reminderService, 'reschedule').mockResolvedValue();
    const newStart = new Date('2030-06-01T15:00:00.000Z');
    const newEnd = new Date('2030-06-01T16:00:00.000Z');
    BookingRepository.prototype.findById = async () => booking as any;
    BookingRepository.prototype.updateBookingInTransaction = async () =>
      ({ ...booking, startTime: newStart, endTime: newEnd }) as any;
    await new BookingService().updateBooking(
      BOOKING_ID,
      { startTime: newStart, endTime: newEnd } as any,
      USER_ID,
      Role.EMPLOYEE,
    );
    expect(reschedule).toHaveBeenCalled();
  });
});
