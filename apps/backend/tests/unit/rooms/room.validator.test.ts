import { describe, expect, it } from 'vitest';
import { RoomStatus } from '@prisma/client';
import {
  CreateRoomSchema,
  GetRoomsQuerySchema,
  RoomAvailabilityQuerySchema,
  RoomIdSchema,
  UpdateRoomSchema,
} from '../../../src/validators/room.validator';

describe('CreateRoomSchema', () => {
  const valid = {
    name: 'Orion',
    capacity: 8,
    floor: 2,
    building: 'HQ',
    equipments: ['projector'],
  };

  it('accepts a valid room and defaults status to ACTIVE', () => {
    const parsed = CreateRoomSchema.parse(valid);
    expect(parsed.status).toBe(RoomStatus.ACTIVE);
    expect(parsed.capacity).toBe(8);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = CreateRoomSchema.safeParse({ ...valid, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects capacity below 1', () => {
    const result = CreateRoomSchema.safeParse({ ...valid, capacity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID room id', () => {
    expect(RoomIdSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('UpdateRoomSchema', () => {
  it('accepts a status-only disable payload', () => {
    const parsed = UpdateRoomSchema.parse({ status: RoomStatus.INACTIVE });
    expect(parsed.status).toBe(RoomStatus.INACTIVE);
  });
});

describe('GetRoomsQuerySchema', () => {
  it('accepts server-side filters including equipment and capacity', () => {
    const parsed = GetRoomsQuerySchema.parse({
      building: 'HQ',
      floor: '2',
      minCapacity: '6',
      equipment: 'projector',
      status: 'ACTIVE',
    });
    expect(parsed.building).toBe('HQ');
    expect(parsed.floor).toBe(2);
    expect(parsed.minCapacity).toBe(6);
    expect(parsed.equipment).toBe('projector');
    expect(parsed.status).toBe(RoomStatus.ACTIVE);
  });
});

describe('RoomAvailabilityQuerySchema', () => {
  it('accepts a date range with timezone offset', () => {
    const parsed = RoomAvailabilityQuerySchema.parse({
      startDate: '2030-01-01T00:00:00.000+00:00',
      endDate: '2030-01-02T00:00:00.000+00:00',
    });
    expect(parsed.endDate.getTime()).toBeGreaterThan(parsed.startDate.getTime());
  });

  it('rejects an inverted range', () => {
    const result = RoomAvailabilityQuerySchema.safeParse({
      startDate: '2030-01-02T00:00:00.000+00:00',
      endDate: '2030-01-01T00:00:00.000+00:00',
    });
    expect(result.success).toBe(false);
  });
});
