export type Role = 'ADMIN' | 'EMPLOYEE';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type User = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  roomId: string;
  name: string;
  capacity: number;
  floor: number;
  building: string;
  description?: string;
  equipments: string[];
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  bookingId: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
  room?: Room;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
