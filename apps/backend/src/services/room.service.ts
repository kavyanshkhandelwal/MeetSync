import { Room, RoomStatus } from '@prisma/client';
import { RoomRepository, PaginatedResult } from '../repositories/room.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { ConflictError, NotFoundError } from '../utils/errors';
import {
  CreateRoomInput,
  UpdateRoomInput,
  GetRoomsQueryInput,
  RoomAvailabilityQueryInput,
} from '../validators/room.validator';
import { appEventEmitter, EventType } from './eventEmitter.service';
import socketService from './socket.service';

export type RoomAvailabilityResult = {
  roomId: string;
  status: RoomStatus;
  bookable: boolean;
  startDate: Date;
  endDate: Date;
  bookings: Array<{
    bookingId: string;
    startTime: Date;
    endTime: Date;
    status: string;
    purpose: string;
  }>;
};

export class RoomService {
  private roomRepository: RoomRepository;
  private bookingRepository: BookingRepository;

  constructor() {
    this.roomRepository = new RoomRepository();
    this.bookingRepository = new BookingRepository();
  }

  async getRooms(query: GetRoomsQueryInput): Promise<PaginatedResult<Room>> {
    return this.roomRepository.findMany(query);
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }
    return room;
  }

  async createRoom(data: CreateRoomInput, userId: string): Promise<Room> {
    const room = await this.roomRepository.create(data);
    
    // Emit events
    appEventEmitter.emitRoomEvent(EventType.ROOM_CREATED, {
      roomId: room.roomId,
      userId,
      changes: { ...data },
    });
    
    // Emit socket event
    socketService.emitRoomUpdated(room);
    
    return room;
  }

  async updateRoom(id: string, data: UpdateRoomInput, userId: string): Promise<Room> {
    await this.getRoomById(id); // Verify room exists
    const room = await this.roomRepository.update(id, data);
    
    // Emit events
    appEventEmitter.emitRoomEvent(EventType.ROOM_UPDATED, {
      roomId: room.roomId,
      userId,
      changes: { ...data },
    });

    // Emit socket event
    socketService.emitRoomUpdated(room);
    
    return room;
  }

  async deleteRoom(id: string): Promise<void> {
    await this.getRoomById(id);
    const blocking = await this.bookingRepository.countBlockingFutureBookings(id);
    if (blocking > 0) {
      throw new ConflictError(
        'This room has upcoming or active bookings. Deactivate it instead of deleting so existing reservations are kept.',
      );
    }
    await this.roomRepository.delete(id);
    socketService.emitRoomDeleted(id);
  }

  async getAvailability(
    id: string,
    query: RoomAvailabilityQueryInput,
  ): Promise<RoomAvailabilityResult> {
    const room = await this.getRoomById(id);
    const bookings = await this.bookingRepository.findOccupyingInRange(
      id,
      query.startDate,
      query.endDate,
    );

    return {
      roomId: room.roomId,
      status: room.status,
      bookable: room.status === RoomStatus.ACTIVE,
      startDate: query.startDate,
      endDate: query.endDate,
      bookings,
    };
  }
}
