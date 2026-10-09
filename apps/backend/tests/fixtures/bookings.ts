import { BookingStatus, Role } from '@prisma/client';
import { BOOKING_ID, ROOM_ID, USER_ID } from './ids';
import { makeRoom } from './rooms';

export function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    bookingId: BOOKING_ID,
    userId: USER_ID,
    roomId: ROOM_ID,
    startTime: new Date('2030-01-01T10:00:00.000Z'),
    endTime: new Date('2030-01-01T11:00:00.000Z'),
    purpose: 'Architecture review',
    status: BookingStatus.PENDING,
    room: makeRoom(),
    user: { userId: USER_ID, email: 'ada@company.com', role: Role.EMPLOYEE },
    ...overrides,
  };
}
