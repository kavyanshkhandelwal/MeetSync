import '../../setup/socket.env';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Socket } from 'socket.io-client';
import socketService from '../../../src/services/socket.service';
import { BookingService } from '../../../src/services/booking.service';
import { RoomService } from '../../../src/services/room.service';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { Role, BookingStatus } from '@prisma/client';
import {
  closeServer,
  createAuthenticatedClient,
  createClient,
  delay,
  initSocketServer,
  listen,
  waitForConnect,
  waitForEvent,
} from '../../helpers/socket';
import { reminderService } from '../../../src/services/reminder.service';
import { BOOKING_ID, ROOM_ID, USER_ID } from '../../fixtures/ids';

const activeRoom = {
  roomId: ROOM_ID,
  name: 'Test Room',
  status: 'ACTIVE',
  capacity: 8,
  floor: 1,
  building: 'HQ',
};

const pendingBooking = {
  bookingId: BOOKING_ID,
  userId: USER_ID,
  roomId: ROOM_ID,
  startTime: new Date('2030-01-01T10:00:00.000Z'),
  endTime: new Date('2030-01-01T11:00:00.000Z'),
  purpose: 'Runtime socket test',
  status: BookingStatus.PENDING,
  room: activeRoom,
  user: { userId: USER_ID, role: Role.EMPLOYEE },
};

const createInput = {
  roomId: ROOM_ID,
  startTime: pendingBooking.startTime,
  endTime: pendingBooking.endTime,
  purpose: pendingBooking.purpose,
};

describe('Socket.IO runtime audit', () => {
  let port: number;
  let server: ReturnType<typeof initSocketServer>['server'];
  const clients: Socket[] = [];

  const originalRoomFindById = RoomRepository.prototype.findById;
  const originalRoomDelete = RoomRepository.prototype.delete;
  const originalBookingFindById = BookingRepository.prototype.findById;
  const originalCreateInTx = BookingRepository.prototype.createBookingInTransaction;
  const originalUpdateInTx = BookingRepository.prototype.updateBookingInTransaction;
  const originalBookingUpdate = BookingRepository.prototype.update;
  const originalBookingDelete = BookingRepository.prototype.delete;
  const originalCountBlocking = BookingRepository.prototype.countBlockingFutureBookings;
  const originalSchedule = reminderService.schedule;
  const originalCancelReminder = reminderService.cancel;
  const originalReschedule = reminderService.reschedule;

  function track(socket: Socket): Socket {
    clients.push(socket);
    return socket;
  }

  beforeAll(async () => {
    reminderService.schedule = async () => undefined;
    reminderService.cancel = async () => undefined;
    reminderService.reschedule = async () => undefined;
    ({ server } = initSocketServer());
    port = await listen(server);
  });

  afterEach(() => {
    RoomRepository.prototype.findById = originalRoomFindById;
    RoomRepository.prototype.delete = originalRoomDelete;
    BookingRepository.prototype.findById = originalBookingFindById;
    BookingRepository.prototype.createBookingInTransaction = originalCreateInTx;
    BookingRepository.prototype.updateBookingInTransaction = originalUpdateInTx;
    BookingRepository.prototype.update = originalBookingUpdate;
    BookingRepository.prototype.delete = originalBookingDelete;
    BookingRepository.prototype.countBlockingFutureBookings = originalCountBlocking;

    while (clients.length) {
      const socket = clients.pop();
      socket?.removeAllListeners();
      socket?.disconnect();
    }
  });

  afterAll(async () => {
    reminderService.schedule = originalSchedule;
    reminderService.cancel = originalCancelReminder;
    reminderService.reschedule = originalReschedule;
    await closeServer(server);
  });

  it('Test 1: Client connects successfully', async () => {
    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);
    expect(socket.connected).toBe(true);
  });

  it('Test 2: Booking creation emits exactly one ROOM_BOOKED event', async () => {
    RoomRepository.prototype.findById = async () => activeRoom as any;
    BookingRepository.prototype.createBookingInTransaction = async () => pendingBooking as any;

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    const payloads: unknown[] = [];
    socket.on('ROOM_BOOKED', (payload) => {
      count += 1;
      payloads.push(payload);
    });
    socket.on('bookingCreated', () => {
      count += 100;
    });

    const received = waitForEvent(socket, 'ROOM_BOOKED');
    await new BookingService().createBooking(createInput as any, USER_ID);
    const payload = await received;
    await delay(150);

    expect(count).toBe(1);
    expect((payload as any).bookingId).toBe(BOOKING_ID);
    expect(payloads).toHaveLength(1);
  });

  it('Test 3: Booking cancellation emits exactly one ROOM_CANCELLED event', async () => {
    BookingRepository.prototype.findById = async () => pendingBooking as any;
    BookingRepository.prototype.update = async () =>
      ({ ...pendingBooking, status: BookingStatus.CANCELLED }) as any;

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    socket.on('ROOM_CANCELLED', () => {
      count += 1;
    });
    socket.on('bookingCancelled', () => {
      count += 100;
    });

    const received = waitForEvent(socket, 'ROOM_CANCELLED');
    await new BookingService().cancelBooking(BOOKING_ID, USER_ID, Role.EMPLOYEE);
    await received;
    await delay(150);

    expect(count).toBe(1);
  });

  it('Test 4: Booking update emits exactly one BOOKING_UPDATED event', async () => {
    BookingRepository.prototype.findById = async () => pendingBooking as any;
    BookingRepository.prototype.updateBookingInTransaction = async () =>
      ({ ...pendingBooking, purpose: 'Updated purpose' }) as any;

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    socket.on('BOOKING_UPDATED', () => {
      count += 1;
    });
    socket.on('bookingUpdated', () => {
      count += 100;
    });

    const received = waitForEvent(socket, 'BOOKING_UPDATED');
    await new BookingService().updateBooking(
      BOOKING_ID,
      {
        purpose: 'Updated purpose',
        startTime: pendingBooking.startTime,
        endTime: pendingBooking.endTime,
      } as any,
      USER_ID,
      Role.EMPLOYEE,
    );
    await received;
    await delay(150);

    expect(count).toBe(1);
  });

  it('Test 5: Failed booking transaction emits NO booking-created event', async () => {
    RoomRepository.prototype.findById = async () => activeRoom as any;
    BookingRepository.prototype.createBookingInTransaction = async () => {
      throw new Error('Room is already booked for the selected time slot');
    };

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    socket.on('ROOM_BOOKED', () => {
      count += 1;
    });
    socket.on('bookingCreated', () => {
      count += 1;
    });

    await expect(new BookingService().createBooking(createInput as any, USER_ID)).rejects.toThrow(
      /already booked/i,
    );
    await delay(200);

    expect(count).toBe(0);
  });

  it('Test 6: Two clients receive the update', async () => {
    const a = track(createAuthenticatedClient(port));
    const b = track(createAuthenticatedClient(port));
    await Promise.all([waitForConnect(a), waitForConnect(b)]);

    const receivedA = waitForEvent(a, 'BOOKING_UPDATED');
    const receivedB = waitForEvent(b, 'BOOKING_UPDATED');

    const payload = { bookingId: BOOKING_ID, source: 'two-client-test' };
    socketService.emitBookingUpdated(payload);

    const [pa, pb] = await Promise.all([receivedA, receivedB]);
    expect((pa as any).bookingId).toBe(BOOKING_ID);
    expect((pb as any).bookingId).toBe(BOOKING_ID);
  });

  it('Test 7: Frontend listener invalidates React Query cache without a page refresh', async () => {
    const invalidated: string[][] = [];
    const queryClient = {
      invalidateQueries: ({ queryKey }: { queryKey: string[] }) => {
        invalidated.push(queryKey);
      },
    };

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    socket.on('ROOM_BOOKED', () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    });
    socket.on('ROOM_CANCELLED', () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    });
    socket.on('BOOKING_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    });
    socket.on('ROOM_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    });
    socket.on('ROOM_DELETED', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    });

    socketService.emitBookingCreated(pendingBooking);
    socketService.emitBookingUpdated(pendingBooking);
    socketService.emitBookingCancelled(pendingBooking);
    socketService.emitRoomUpdated(activeRoom);
    socketService.emitRoomDeleted(ROOM_ID);

    await delay(250);

    expect(invalidated).toEqual([
      ['bookings'],
      ['room-availability'],
      ['bookings'],
      ['room-availability'],
      ['bookings'],
      ['room-availability'],
      ['rooms'],
      ['rooms'],
      ['room-availability'],
    ]);
  });

  it('Test 8: Reconnect restores functionality', async () => {
    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);
    socket.disconnect();
    expect(socket.connected).toBe(false);

    socket.connect();
    await waitForConnect(socket);
    expect(socket.connected).toBe(true);

    const received = waitForEvent(socket, 'ROOM_BOOKED');
    socketService.emitBookingCreated({ bookingId: BOOKING_ID, roomId: ROOM_ID, reconnect: true });
    const payload = await received;
    expect((payload as any).bookingId).toBe(BOOKING_ID);
  });

  it('Test 9: Unauthorized socket connection is rejected if authentication is required', async () => {
    const socket = track(createClient(port));
    let connected = false;
    try {
      await waitForConnect(socket, 2500);
      connected = socket.connected;
    } catch {
      connected = false;
    }

    expect(connected).toBe(false);
  });

  it('Extra: room delete emits ROOM_DELETED after the write succeeds', async () => {
    RoomRepository.prototype.findById = async () => activeRoom as any;
    BookingRepository.prototype.countBlockingFutureBookings = async () => 0;
    RoomRepository.prototype.delete = async () => undefined;

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    socket.on('ROOM_UPDATED', () => {
      count += 1;
    });
    socket.on('roomDeleted', () => {
      count += 1;
    });
    socket.on('ROOM_DELETED', () => {
      count += 1;
    });

    const deleted = waitForEvent(socket, 'ROOM_DELETED');
    await new RoomService().deleteRoom(ROOM_ID);
    const payload = await deleted;
    await delay(150);
    expect((payload as any).roomId).toBe(ROOM_ID);
    expect((payload as any).deleted).toBe(true);
    expect(count).toBe(1);
  });

  it('rejects an invalid JWT on connect', async () => {
    const socket = track(createClient(port, 'not-a-jwt'));
    let connected = false;
    try {
      await waitForConnect(socket, 2500);
      connected = socket.connected;
    } catch {
      connected = false;
    }
    expect(connected).toBe(false);
  });

  it('two authenticated clients both receive ROOM_BOOKED from a booking mutation', async () => {
    RoomRepository.prototype.findById = async () => activeRoom as any;
    BookingRepository.prototype.createBookingInTransaction = async () => pendingBooking as any;

    const a = track(createAuthenticatedClient(port));
    const b = track(createAuthenticatedClient(port));
    await Promise.all([waitForConnect(a), waitForConnect(b)]);

    const receivedA = waitForEvent(a, 'ROOM_BOOKED');
    const receivedB = waitForEvent(b, 'ROOM_BOOKED');

    await new BookingService().createBooking(createInput as any, USER_ID);
    const [pa, pb] = await Promise.all([receivedA, receivedB]);

    expect((pa as any).bookingId).toBe(BOOKING_ID);
    expect((pb as any).bookingId).toBe(BOOKING_ID);
    expect(pa).not.toHaveProperty('purpose');
    expect(pb).not.toHaveProperty('user');
  });

  it('failed booking update emits NO BOOKING_UPDATED event', async () => {
    BookingRepository.prototype.findById = async () => pendingBooking as any;
    BookingRepository.prototype.updateBookingInTransaction = async () => {
      throw new Error('Room is already booked for the selected time slot');
    };

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    socket.on('BOOKING_UPDATED', () => {
      count += 1;
    });

    await expect(
      new BookingService().updateBooking(
        BOOKING_ID,
        {
          startTime: pendingBooking.startTime,
          endTime: pendingBooking.endTime,
        } as any,
        USER_ID,
        Role.EMPLOYEE,
      ),
    ).rejects.toThrow(/already booked/i);
    await delay(200);
    expect(count).toBe(0);
  });

  it('failed room delete emits NO ROOM_DELETED event', async () => {
    RoomRepository.prototype.findById = async () => activeRoom as any;
    BookingRepository.prototype.countBlockingFutureBookings = async () => 2;

    const socket = track(createAuthenticatedClient(port));
    await waitForConnect(socket);

    let count = 0;
    socket.on('ROOM_DELETED', () => {
      count += 1;
    });

    await expect(new RoomService().deleteRoom(ROOM_ID)).rejects.toThrow(/upcoming or active/i);
    await delay(200);
    expect(count).toBe(0);
  });
});
