export type PublicBookingPayload = {
  bookingId?: string;
  roomId?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: string;
};

export type PublicRoomPayload = {
  roomId?: string;
  name?: string;
  status?: string;
  building?: string;
  floor?: number;
  capacity?: number;
};

export function publicBookingPayload(data: any): PublicBookingPayload {
  if (!data) {
    return {};
  }
  return {
    bookingId: data.bookingId,
    roomId: data.roomId,
    startTime: data.startTime,
    endTime: data.endTime,
    status: data.status,
  };
}

export function publicRoomPayload(data: any): PublicRoomPayload {
  if (!data) {
    return {};
  }
  return {
    roomId: data.roomId,
    name: data.name,
    status: data.status,
    building: data.building,
    floor: data.floor,
    capacity: data.capacity,
  };
}
