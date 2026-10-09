import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingStatus, RoomStatus } from '@prisma/client';
import { RecommendationService } from '../../../src/services/recommendation.service';
import { RoomRepository } from '../../../src/repositories/room.repository';
import { BookingRepository } from '../../../src/repositories/booking.repository';
import { HybridConstraintExtractor } from '../../../src/services/extraction/hybrid.extractor';
import { FallbackConstraintExtractor } from '../../../src/services/extraction/fallback.extractor';
import { OpenAiConstraintExtractor } from '../../../src/services/extraction/openai.extractor';
import { makeRoom } from '../../fixtures/rooms';

const NOW = new Date('2030-06-15T10:00:00.000Z');
const QUERY = 'Book a room tomorrow at 3 PM for 8 people with a projector.';

const LLM_CONSTRAINTS = {
  capacity: 8,
  startTime: '2030-06-16T15:00:00+00:00',
  endTime: '2030-06-16T16:00:00+00:00',
  equipment: ['projector'],
  building: null,
  floor: null,
  purpose: 'Team meeting',
};

function room(overrides: Record<string, unknown> = {}) {
  return makeRoom({
    status: RoomStatus.ACTIVE,
    capacity: 8,
    equipments: ['Projector'],
    ...overrides,
  });
}

describe('RecommendationService with mocked LLM extraction', () => {
  const originalFindAll = RoomRepository.prototype.findAll;
  const originalMatching = RoomRepository.prototype.findMatching;
  const originalOccupying = BookingRepository.prototype.findOccupyingInRange;

  afterEach(() => {
    RoomRepository.prototype.findAll = originalFindAll;
    RoomRepository.prototype.findMatching = originalMatching;
    BookingRepository.prototype.findOccupyingInRange = originalOccupying;
  });

  function serviceWithLlm(complete: () => Promise<unknown>) {
    const extractor = new HybridConstraintExtractor(
      new FallbackConstraintExtractor(),
      new OpenAiConstraintExtractor(complete),
    );
    return new RecommendationService(new RoomRepository(), new BookingRepository(), extractor);
  }

  it('uses validated LLM constraints and does not take room IDs from the model', async () => {
    RoomRepository.prototype.findAll = async () => [room({ roomId: 'from-db' })] as any;
    RoomRepository.prototype.findMatching = async () => [room({ roomId: 'from-db', name: 'Huddle' })] as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;

    const result = await serviceWithLlm(async () => LLM_CONSTRAINTS).recommend(QUERY, NOW);
    expect(result.extractionSource).toBe('llm');
    expect(result.extracted.capacity).toBe(8);
    expect(result.extracted.startTime).toBe('2030-06-16T15:00:00+00:00');
    expect(result.extracted.equipment).toEqual(['Projector']);
    expect(result.rooms.map((item) => item.roomId)).toEqual(['from-db']);
    expect(JSON.stringify(result)).not.toContain('model-room');
  });

  it('returns an empty verified list when LLM extraction succeeds but no rooms match', async () => {
    RoomRepository.prototype.findAll = async () => [room()] as any;
    RoomRepository.prototype.findMatching = async () => [] as any;
    const occupying = vi.fn();
    BookingRepository.prototype.findOccupyingInRange = occupying;

    const result = await serviceWithLlm(async () => LLM_CONSTRAINTS).recommend(QUERY, NOW);
    expect(result.extractionSource).toBe('llm');
    expect(result.rooms).toEqual([]);
    expect(result.explanation).toMatch(/No rooms are currently available/i);
    expect(occupying).not.toHaveBeenCalled();
  });

  it('falls back when the model adds availability or booking fields', async () => {
    RoomRepository.prototype.findAll = async () => [room({ roomId: 'r1' })] as any;
    RoomRepository.prototype.findMatching = async () => [room({ roomId: 'r1' })] as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;

    const result = await serviceWithLlm(async () => ({
      ...LLM_CONSTRAINTS,
      roomId: 'model-room',
      available: true,
      score: 11,
      bookingId: 'model-booking',
    })).recommend(QUERY, NOW);

    expect(result.extractionSource).toBe('fallback');
    expect(result.rooms[0]?.roomId).toBe('r1');
    expect(result).not.toHaveProperty('score');
    expect(JSON.stringify(result.extracted)).not.toContain('model-room');
  });

  it('still uses PENDING/CONFIRMED occupying checks on the LLM path', async () => {
    RoomRepository.prototype.findAll = async () => [room({ roomId: 'r1' })] as any;
    RoomRepository.prototype.findMatching = async () => [room({ roomId: 'r1' })] as any;
    BookingRepository.prototype.findOccupyingInRange = async () =>
      [{ bookingId: 'p', status: BookingStatus.PENDING }] as any;

    const blocked = await serviceWithLlm(async () => LLM_CONSTRAINTS).recommend(QUERY, NOW);
    expect(blocked.extractionSource).toBe('llm');
    expect(blocked.rooms).toEqual([]);

    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;
    const open = await serviceWithLlm(async () => LLM_CONSTRAINTS).recommend(QUERY, NOW);
    expect(open.rooms).toHaveLength(1);
  });

  it('does not call a provider when constructed with the fallback extractor only', async () => {
    const complete = vi.fn();
    RoomRepository.prototype.findAll = async () => [room({ roomId: 'r1' })] as any;
    RoomRepository.prototype.findMatching = async () => [room({ roomId: 'r1' })] as any;
    BookingRepository.prototype.findOccupyingInRange = async () => [] as any;

    const result = await new RecommendationService(
      new RoomRepository(),
      new BookingRepository(),
      new FallbackConstraintExtractor(),
    ).recommend('8 people tomorrow at 3 PM with a projector', NOW);

    expect(complete).not.toHaveBeenCalled();
    expect(result.extractionSource).toBe('fallback');
  });
});
