import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function methodBody(source: string, methodName: string): string {
  const start = source.indexOf(`async ${methodName}`);
  expect(start).toBeGreaterThan(-1);
  const next = source.indexOf('\n  async ', start + 1);
  return next === -1 ? source.slice(start) : source.slice(start, next);
}

describe('socket emit happens after the write', () => {
  const bookingSource = fs.readFileSync(
    path.resolve(__dirname, '../../../src/services/booking.service.ts'),
    'utf8',
  );
  const roomSource = fs.readFileSync(
    path.resolve(__dirname, '../../../src/services/room.service.ts'),
    'utf8',
  );

  it('createBooking writes in a transaction before emitBookingCreated', () => {
    const body = methodBody(bookingSource, 'createBooking');
    expect(body.indexOf('createBookingInTransaction')).toBeLessThan(body.indexOf('emitBookingCreated'));
  });

  it('updateBooking writes before emitBookingUpdated', () => {
    const body = methodBody(bookingSource, 'updateBooking');
    expect(body.indexOf('updateBookingInTransaction')).toBeLessThan(body.indexOf('emitBookingUpdated'));
    expect(body.indexOf('this.bookingRepository.update')).toBeLessThan(body.indexOf('emitBookingUpdated'));
  });

  it('cancelBooking updates status before emitBookingCancelled', () => {
    const body = methodBody(bookingSource, 'cancelBooking');
    expect(body.indexOf('this.bookingRepository.update')).toBeLessThan(body.indexOf('emitBookingCancelled'));
  });

  it('deleteBooking deletes before emitBookingCancelled', () => {
    const body = methodBody(bookingSource, 'deleteBooking');
    expect(body.indexOf('this.bookingRepository.delete')).toBeLessThan(body.indexOf('emitBookingCancelled'));
  });

  it('createRoom and updateRoom persist before emitRoomUpdated', () => {
    const createBody = methodBody(roomSource, 'createRoom');
    const updateBody = methodBody(roomSource, 'updateRoom');
    expect(createBody.indexOf('this.roomRepository.create')).toBeLessThan(createBody.indexOf('emitRoomUpdated'));
    expect(updateBody.indexOf('this.roomRepository.update')).toBeLessThan(updateBody.indexOf('emitRoomUpdated'));
  });

  it('deleteRoom deletes before emitRoomDeleted', () => {
    const body = methodBody(roomSource, 'deleteRoom');
    expect(body.indexOf('this.roomRepository.delete')).toBeLessThan(body.indexOf('emitRoomDeleted'));
  });
});
