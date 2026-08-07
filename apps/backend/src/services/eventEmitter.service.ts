import { EventEmitter } from 'events';

// Define event types
export enum EventType {
  BOOKING_CREATED = 'booking.created',
  BOOKING_UPDATED = 'booking.updated',
  BOOKING_CANCELLED = 'booking.cancelled',
  ROOM_CREATED = 'room.created',
  ROOM_UPDATED = 'room.updated',
}

// Define event data interfaces
export interface BookingEventData {
  bookingId: string;
  userId: string;
  changes?: Partial<any>;
}

export interface RoomEventData {
  roomId: string;
  userId: string;
  changes?: Partial<any>;
}

// Custom Event Emitter class
class AppEventEmitter extends EventEmitter {
  emitBookingEvent(type: EventType, data: BookingEventData) {
    this.emit(type, data);
  }

  emitRoomEvent(type: EventType, data: RoomEventData) {
    this.emit(type, data);
  }
}

// Singleton instance
export const appEventEmitter = new AppEventEmitter();
