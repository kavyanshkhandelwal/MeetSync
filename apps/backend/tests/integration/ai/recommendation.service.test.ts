import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingStatus, RoomStatus } from '@prisma/client';
import { RecommendationService } from '../../../src/services/recommendation.service';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { makeRoom } from '../../fixtures/rooms';

const NOW = new Date('2030-06-15T10:00:00.000Z');
const QUERY = '8 people tomorrow at 3 PM with a projector';
const START = new Date('2030-06-16T15:00:00.000Z');
const END = new Date('2030-06-16T16:00:00.000Z');

function room(overrides: Record<string, unknown>) {
  return makeRoom({
    status: RoomStatus.ACTIVE,
    equipments: ['Projector'],
    ...overrides,
  });
}

describe('RecommendationService pipeline', () => {
  const originalFindAll = RoomRepository.prototype.findAll;
  const originalMatching = RoomRepository.prototype.findMatching;
  const originalOccupying = BookingRepository.prototype.findOccupyingInRange;

  afterEach(() => {
    RoomRepository.prototype.findAll = originalFindAll;
    RoomRepository.prototype.findMatching = originalMatching;
    BookingRepository.prototype.findOccupyingInRange = originalOccupying;
  });

  function stubRooms(rooms: ReturnType<typeof room>[]) {
    RoomRepository.prototype.findAll = async () => rooms as any;
    RoomRepository.prototype.findMatching = async () => rooms as any;
  }

  it('returns only rooms with no occupying bookings and labels fallback extraction', async () => {
    stubRooms([
      room({ roomId: 'tight', name: 'Huddle', capacity: 8 }),
      room({ roomId: 'wide', name: 'Board', capacity: 20 }),
    ]);
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;

    const result = await new RecommendationService().recommend(QUERY, NOW);
    expect(result.extractionSource).toBe('fallback');
    expect(result.extracted.capacity).toBe(8);
    expect(result.rooms.map((item) => item.roomId)).toEqual(['tight', 'wide']);
    expect(result.explanation).toMatch(/verified against existing bookings/i);
    expect(result.rooms[0]).not.toHaveProperty('available');
  });

  it('PENDING occupying bookings block a room', async () => {
    stubRooms([room({ roomId: 'r1', name: 'Orion', capacity: 8 })]);
    BookingRepository.prototype.findOccupyingInRange = async () =>
      [{ bookingId: 'p', status: BookingStatus.PENDING }] as any;
    const result = await new RecommendationService().recommend(QUERY, NOW);
    expect(result.rooms).toEqual([]);
  });

  it('CONFIRMED occupying bookings block a room', async () => {
    stubRooms([room({ roomId: 'r1', name: 'Orion', capacity: 8 })]);
    BookingRepository.prototype.findOccupyingInRange = async () =>
      [{ bookingId: 'c', status: BookingStatus.CONFIRMED }] as any;
    const result = await new RecommendationService().recommend(QUERY, NOW);
    expect(result.rooms).toEqual([]);
  });

  it('CANCELLED bookings do not block because occupying returns none', async () => {
    stubRooms([room({ roomId: 'r1', name: 'Orion', capacity: 8 })]);
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const result = await new RecommendationService().recommend(QUERY, NOW);
    expect(result.rooms).toHaveLength(1);
  });

  it('COMPLETED bookings do not block because occupying returns none', async () => {
    stubRooms([room({ roomId: 'r1', name: 'Orion', capacity: 8 })]);
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const result = await new RecommendationService().recommend(QUERY, NOW);
    expect(result.rooms).toHaveLength(1);
  });

  it('asks occupying only for the candidate room', async () => {
    stubRooms([room({ roomId: 'candidate', name: 'Orion', capacity: 8 })]);
    let requestedId: string | undefined;
    BookingRepository.prototype.findOccupyingInRange = async (roomId: string) => {
      requestedId = roomId;
      return [] as any;
    };
    await new RecommendationService().recommend(QUERY, NOW);
    expect(requestedId).toBe('candidate');
  });

  it('treats a back-to-back occupying miss as available', async () => {
    stubRooms([room({ roomId: 'r1', name: 'Orion', capacity: 8 })]);
    let range: { start: Date; end: Date } | undefined;
    BookingRepository.prototype.findOccupyingInRange = async (_id, start, end) => {
      range = { start, end };
      return [] as any;
    };
    const result = await new RecommendationService().recommend(QUERY, NOW);
    expect(result.rooms).toHaveLength(1);
    expect(range?.start.toISOString()).toBe(START.toISOString());
    expect(range?.end.toISOString()).toBe(END.toISOString());
  });

  it('passes every required equipment item into findMatching', async () => {
    let filters: any;
    RoomRepository.prototype.findAll = async () =>
      [room({ equipments: ['Projector', 'Whiteboard'] })] as any;
    RoomRepository.prototype.findMatching = async (input) => {
      filters = input;
      return [room({ roomId: 'r1', name: 'Orion', capacity: 8, equipments: ['Projector', 'Whiteboard'] })] as any;
    };
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;

    await new RecommendationService().recommend(
      '8 people tomorrow at 3 PM with a projector and a whiteboard',
      NOW,
    );
    expect(filters.equipments).toEqual(['Projector', 'Whiteboard']);
    expect(filters.status).toBe(RoomStatus.ACTIVE);
    expect(filters.minCapacity).toBe(8);
  });

  it('uses supplied edited constraints and never calls the extractor', async () => {
    const extract = vi.fn();
    let filters: any;
    RoomRepository.prototype.findAll = async () => [room({ capacity: 16 })] as any;
    RoomRepository.prototype.findMatching = async (input) => {
      filters = input;
      return [room({ roomId: 'r12', name: 'Atlas', capacity: 16 })] as any;
    };
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;

    const result = await new RecommendationService(
      new RoomRepository(),
      new BookingRepository(),
      { extract },
    ).recommend(QUERY, NOW, {
      capacity: 12,
      startTime: '2030-06-16T15:00:00+00:00',
      endTime: '2030-06-16T16:00:00+00:00',
      equipment: [],
      purpose: 'Planning workshop',
    });

    expect(extract).not.toHaveBeenCalled();
    expect(filters.minCapacity).toBe(12);
    expect(result.extracted.capacity).toBe(12);
    expect(result.extracted.purpose).toBe('Planning workshop');
    expect(result.rooms.map((item) => item.roomId)).toEqual(['r12']);
  });

  it('rejects invalid edited constraints before searching rooms', async () => {
    stubRooms([room({ roomId: 'r1', name: 'Orion', capacity: 8 })]);
    const extract = vi.fn();
    await expect(
      new RecommendationService(new RoomRepository(), new BookingRepository(), { extract }).recommend(
        QUERY,
        NOW,
        {
          capacity: 0,
          startTime: '2030-06-16T15:00:00+00:00',
          endTime: '2030-06-16T16:00:00+00:00',
          equipment: [],
        },
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(extract).not.toHaveBeenCalled();
  });
});
