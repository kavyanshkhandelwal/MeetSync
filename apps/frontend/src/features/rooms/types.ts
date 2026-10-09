export type CreateRoomInput = {
  name: string;
  capacity: number;
  floor: number;
  building: string;
  description?: string;
  equipments: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
};

export type UpdateRoomInput = Partial<CreateRoomInput>;

export type GetRoomsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  building?: string;
  floor?: number;
  minCapacity?: number;
  maxCapacity?: number;
  equipment?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type RoomAvailabilityQuery = {
  startDate: string;
  endDate: string;
};

export type OccupyingBooking = {
  bookingId: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose: string;
};

export type RoomAvailability = {
  roomId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  bookable: boolean;
  startDate: string;
  endDate: string;
  bookings: OccupyingBooking[];
};

export type PaginatedRoomsResponse = {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
