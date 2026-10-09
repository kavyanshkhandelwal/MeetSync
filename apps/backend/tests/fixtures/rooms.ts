import { RoomStatus } from '@prisma/client';
import { ROOM_ID } from './ids';

export function makeRoom(overrides: Record<string, unknown> = {}) {
  return {
    roomId: ROOM_ID,
    name: 'Orion',
    capacity: 8,
    floor: 2,
    building: 'HQ',
    description: 'Test room',
    equipments: ['projector'],
    status: RoomStatus.ACTIVE,
    ...overrides,
  };
}
