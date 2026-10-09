import { describe, expect, it } from 'vitest';
import { EventType } from '../../../src/services/eventEmitter.service';

describe('audit event names', () => {
  it('exports the five booking/room event strings used by AuditLogService', () => {
    expect(EventType.BOOKING_CREATED).toBe('booking.created');
    expect(EventType.BOOKING_UPDATED).toBe('booking.updated');
    expect(EventType.BOOKING_CANCELLED).toBe('booking.cancelled');
    expect(EventType.ROOM_CREATED).toBe('room.created');
    expect(EventType.ROOM_UPDATED).toBe('room.updated');
  });
});
