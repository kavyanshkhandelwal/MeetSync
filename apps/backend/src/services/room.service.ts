import { Room, Prisma } from '@prisma/client';
import { RoomRepository, PaginatedResult } from '../repositories/room.repository';
import { NotFoundError } from '../utils/errors';
import { CreateRoomInput, UpdateRoomInput, GetRoomsQueryInput } from '../validators/room.validator';
import { appEventEmitter, EventType } from './eventEmitter.service';
import socketService from './socket.service';

export class RoomService {
  private roomRepository: RoomRepository;

  constructor() {
    this.roomRepository = new RoomRepository();
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
    await this.getRoomById(id); // Verify room exists
    await this.roomRepository.delete(id);
  }
}
