import { describe, expect, it } from 'vitest';
import { publicBookingPayload, publicRoomPayload } from '../../../src/services/socket.payloads';

describe('socket public payloads', () => {
  it('strips user and purpose from booking events', () => {
    const payload = publicBookingPayload({
      bookingId: 'b1',
      roomId: 'r1',
      startTime: '2030-01-01T10:00:00.000Z',
      endTime: '2030-01-01T11:00:00.000Z',
      status: 'PENDING',
      purpose: 'Secret planning',
      user: { email: 'ada@company.com', firstName: 'Ada' },
      userId: 'u1',
    });
    expect(payload).toEqual({
      bookingId: 'b1',
      roomId: 'r1',
      startTime: '2030-01-01T10:00:00.000Z',
      endTime: '2030-01-01T11:00:00.000Z',
      status: 'PENDING',
    });
    expect(payload).not.toHaveProperty('purpose');
    expect(payload).not.toHaveProperty('user');
  });

  it('keeps only public room fields', () => {
    const payload = publicRoomPayload({
      roomId: 'r1',
      name: 'Orion',
      status: 'ACTIVE',
      building: 'HQ',
      floor: 2,
      capacity: 8,
      description: 'internal notes',
      imageUrl: 'http://secret',
    });
    expect(payload.roomId).toBe('r1');
    expect(payload).not.toHaveProperty('description');
    expect(payload).not.toHaveProperty('imageUrl');
  });
});
