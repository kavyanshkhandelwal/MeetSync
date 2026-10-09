import { describe, expect, it } from 'vitest';
import { matchBuilding, normalizeEquipment } from '../../../src/domain/recommendation.normalize';
import { buildRoomWhere } from '../../../src/repositories/room.repository';
import { RoomStatus } from '@prisma/client';

const INVENTORY = ['Projector', 'Video Conference', 'Whiteboard', 'TV'];

describe('equipment normalization', () => {
  it('matches one item case-insensitively', () => {
    expect(normalizeEquipment(['projector'], INVENTORY)).toEqual(['Projector']);
  });

  it('keeps every required inventory item', () => {
    expect(normalizeEquipment(['projector', 'whiteboard'], INVENTORY)).toEqual([
      'Projector',
      'Whiteboard',
    ]);
  });

  it('drops unknown equipment instead of inventing a name', () => {
    expect(normalizeEquipment(['laser pointer', 'projector'], INVENTORY)).toEqual(['Projector']);
  });
});

describe('room candidate filters', () => {
  it('requires every listed equipment item with hasEvery', () => {
    const where = buildRoomWhere({
      status: RoomStatus.ACTIVE,
      minCapacity: 8,
      equipments: ['Projector', 'Whiteboard'],
    });
    expect(where.equipments).toEqual({ hasEvery: ['Projector', 'Whiteboard'] });
    expect(where.status).toBe(RoomStatus.ACTIVE);
    expect(where.capacity).toEqual({ gte: 8 });
  });

  it('matches a known building from the query', () => {
    expect(matchBuilding('something in Main Tower tomorrow', ['Main Tower', 'West Wing'])).toBe(
      'Main Tower',
    );
  });
});
