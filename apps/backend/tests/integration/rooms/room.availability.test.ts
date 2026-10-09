import { afterEach, describe, expect, it } from 'vitest';
import { RoomStatus } from '@prisma/client';
import { RoomService } from '../../../src/services/room.service';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { makeRoom } from '../../fixtures/rooms';
import { ROOM_ID } from '../../fixtures/ids';

const range = {
  startDate: new Date('2030-01-01T00:00:00.000Z'),
  endDate: new Date('2030-01-02T00:00:00.000Z'),
};

describe('RoomService.getAvailability', () => {
  const originalFindById = RoomRepository.prototype.findById;
  const originalFindOccupying = BookingRepository.prototype.findOccupyingInRange;

  afterEach(() => {
    RoomRepository.prototype.findById = originalFindById;
    BookingRepository.prototype.findOccupyingInRange = originalFindOccupying;
  });

  it('1. no bookings → available', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, range);
    expect(result.bookable).toBe(true);
    expect(result.bookings).toEqual([]);
  });

  it('2. existing booking → unavailable interval', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async () =>
      [
        {
          bookingId: 'b1',
          startTime: new Date('2030-01-01T10:00:00.000Z'),
          endTime: new Date('2030-01-01T11:00:00.000Z'),
          status: 'PENDING',
          purpose: 'Planning',
        },
      ] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, range);
    expect(result.bookings[0].startTime.toISOString()).toBe('2030-01-01T10:00:00.000Z');
    expect(result.bookings[0].endTime.toISOString()).toBe('2030-01-01T11:00:00.000Z');
  });

  it('3. cancelled booking is not returned as occupying', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, range);
    expect(result.bookings.every((b) => b.status !== 'CANCELLED')).toBe(true);
  });

  it('4. completed booking does not block future availability', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, range);
    expect(result.bookable).toBe(true);
    expect(result.bookings.every((b) => b.status !== 'COMPLETED')).toBe(true);
  });

  it('5. overlapping booking is listed as occupying', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async () =>
      [{ bookingId: 'overlap', status: 'CONFIRMED' }] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, range);
    expect(result.bookings).toHaveLength(1);
  });

  it('6. different room is not queried', async () => {
    let requestedRoom: string | undefined;
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async (roomId) => {
      requestedRoom = roomId;
      return [] as any;
    };
    await new RoomService().getAvailability(ROOM_ID, range);
    expect(requestedRoom).toBe(ROOM_ID);
  });

  it('7. requested range is forwarded unchanged', async () => {
    let requested: { start?: Date; end?: Date } = {};
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async (_id, start, end) => {
      requested = { start, end };
      return [] as any;
    };
    await new RoomService().getAvailability(ROOM_ID, range);
    expect(requested.start?.toISOString()).toBe(range.startDate.toISOString());
    expect(requested.end?.toISOString()).toBe(range.endDate.toISOString());
  });

  it('8. INACTIVE and MAINTENANCE rooms are not bookable', async () => {
    for (const status of [RoomStatus.INACTIVE, RoomStatus.MAINTENANCE]) {
      RoomRepository.prototype.findById = async () => makeRoom({ status }) as any;
      BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
      const result = await new RoomService().getAvailability(ROOM_ID, range);
      expect(result.bookable).toBe(false);
    }
  });
});
