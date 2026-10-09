import { afterEach, describe, expect, it } from 'vitest';
import { RoomStatus } from '@prisma/client';
import { RoomService } from '../../../src/services/room.service';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { ConflictError, NotFoundError } from '../../../src/utils/errors';
import { makeRoom } from '../../fixtures/rooms';
import { ROOM_ID, USER_ID } from '../../fixtures/ids';

describe('RoomService (integration, repository stubbed)', () => {
  const originalFindById = RoomRepository.prototype.findById;
  const originalCreate = RoomRepository.prototype.create;
  const originalUpdate = RoomRepository.prototype.update;
  const originalDelete = RoomRepository.prototype.delete;
  const originalCountBlocking = BookingRepository.prototype.countBlockingFutureBookings;
  const originalFindOccupying = BookingRepository.prototype.findOccupyingInRange;

  afterEach(() => {
    RoomRepository.prototype.findById = originalFindById;
    RoomRepository.prototype.create = originalCreate;
    RoomRepository.prototype.update = originalUpdate;
    RoomRepository.prototype.delete = originalDelete;
    BookingRepository.prototype.countBlockingFutureBookings = originalCountBlocking;
    BookingRepository.prototype.findOccupyingInRange = originalFindOccupying;
  });

  it('getRoomById throws NotFoundError when missing', async () => {
    RoomRepository.prototype.findById = async () => null;
    await expect(new RoomService().getRoomById(ROOM_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('getRoomById returns the room when present', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    const room = await new RoomService().getRoomById(ROOM_ID);
    expect(room.roomId).toBe(ROOM_ID);
  });

  it('deleteRoom looks up the room first and then deletes', async () => {
    let deletedId: string | undefined;
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.countBlockingFutureBookings = async () => 0;
    RoomRepository.prototype.delete = async (id: string) => {
      deletedId = id;
    };
    await new RoomService().deleteRoom(ROOM_ID);
    expect(deletedId).toBe(ROOM_ID);
  });

  it('refuses to delete a room that has upcoming bookings', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.countBlockingFutureBookings = async () => 2;
    let deleted = false;
    RoomRepository.prototype.delete = async () => {
      deleted = true;
    };
    await expect(new RoomService().deleteRoom(ROOM_ID)).rejects.toBeInstanceOf(ConflictError);
    expect(deleted).toBe(false);
  });

  it('updateRoom persists a status change to INACTIVE', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    RoomRepository.prototype.update = async (_id, data: any) =>
      makeRoom({ status: data.status }) as any;
    const room = await new RoomService().updateRoom(
      ROOM_ID,
      { status: RoomStatus.INACTIVE },
      USER_ID,
    );
    expect(room.status).toBe(RoomStatus.INACTIVE);
  });

  it('updateRoom persists a status change to MAINTENANCE', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    RoomRepository.prototype.update = async (_id, data: any) =>
      makeRoom({ status: data.status }) as any;
    const room = await new RoomService().updateRoom(
      ROOM_ID,
      { status: RoomStatus.MAINTENANCE },
      USER_ID,
    );
    expect(room.status).toBe(RoomStatus.MAINTENANCE);
  });

  it('getAvailability returns bookable=false for MAINTENANCE rooms', async () => {
    RoomRepository.prototype.findById = async () =>
      makeRoom({ status: RoomStatus.MAINTENANCE }) as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, {
      startDate: new Date('2030-01-01T00:00:00.000Z'),
      endDate: new Date('2030-01-02T00:00:00.000Z'),
    });
    expect(result.bookable).toBe(false);
    expect(result.status).toBe(RoomStatus.MAINTENANCE);
    expect(result.bookings).toEqual([]);
  });

  it('getAvailability returns occupying bookings for an ACTIVE room', async () => {
    RoomRepository.prototype.findById = async () => makeRoom() as any;
    BookingRepository.prototype.findOccupyingInRange = async () =>
      [
        {
          bookingId: 'b1',
          startTime: new Date('2030-01-01T10:00:00.000Z'),
          endTime: new Date('2030-01-01T11:00:00.000Z'),
          status: 'PENDING',
          purpose: 'Standup',
        },
      ] as any;
    const result = await new RoomService().getAvailability(ROOM_ID, {
      startDate: new Date('2030-01-01T00:00:00.000Z'),
      endDate: new Date('2030-01-02T00:00:00.000Z'),
    });
    expect(result.bookable).toBe(true);
    expect(result.bookings).toHaveLength(1);
  });

  it('createRoom persists the payload', async () => {
    const input = {
      name: 'Orion',
      capacity: 8,
      floor: 2,
      building: 'HQ',
      equipments: ['projector'],
      status: 'ACTIVE' as const,
    };
    RoomRepository.prototype.create = async (data: any) => makeRoom(data) as any;
    const room = await new RoomService().createRoom(input as any, USER_ID);
    expect(room.name).toBe('Orion');
  });
});
