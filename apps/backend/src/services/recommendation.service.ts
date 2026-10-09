import { ZodError } from 'zod';
import { RoomStatus } from '@prisma/client';
import { RoomRepository } from '../repositories/room.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { extractRequirements, RawExtractedRequirements } from '../domain/recommendation.extract';
import {
  collectInventory,
  matchBuilding,
  normalizeBuilding,
  normalizeEquipment,
  normalizeFloor,
} from '../domain/recommendation.normalize';
import { buildRecommendationExplanation, rankRecommendedRooms } from '../domain/recommendation.rank';
import { ExtractedRequirements, ExtractedRequirementsSchema } from '../validators/ai.validator';
import { BadRequestError } from '../utils/errors';
import { ConstraintExtractor, ExtractionSource } from './extraction/types';
import { createDefaultExtractor } from './extraction/createExtractor';

export type RecommendedRoom = {
  roomId: string;
  name: string;
  capacity: number;
  building: string;
  floor: number;
  equipments: string[];
};

export type RecommendationResult = {
  extracted: ExtractedRequirements;
  extractionSource: ExtractionSource;
  rooms: RecommendedRoom[];
  explanation: string;
};

export { extractRequirements };

function pickConstraints(
  raw: RawExtractedRequirements,
  inventory: ReturnType<typeof collectInventory>,
  query: string,
): Record<string, unknown> {
  const picked: Record<string, unknown> = {
    capacity: raw.capacity,
    startTime: raw.startTime,
    endTime: raw.endTime,
    equipment: normalizeEquipment(raw.equipment, inventory.equipments),
  };
  const building =
    normalizeBuilding(raw.building, inventory.buildings) || matchBuilding(query, inventory.buildings);
  if (building) {
    picked.building = building;
  }
  const floor = normalizeFloor(raw.floor, inventory.floors);
  if (floor !== undefined) {
    picked.floor = floor;
  }
  if (raw.purpose) {
    picked.purpose = raw.purpose;
  }
  return picked;
}

export class RecommendationService {
  constructor(
    private roomRepository: RoomRepository = new RoomRepository(),
    private bookingRepository: BookingRepository = new BookingRepository(),
    private extractor: ConstraintExtractor = createDefaultExtractor(),
  ) {}

  async recommend(
    query: string,
    now: Date = new Date(),
    supplied?: RawExtractedRequirements,
  ): Promise<RecommendationResult> {
    const catalog = await this.roomRepository.findAll();
    const inventory = collectInventory(catalog);

    const { extracted, source } = supplied
      ? {
          extracted: this.validateExtracted(pickConstraints(supplied, inventory, query)),
          source: 'fallback' as ExtractionSource,
        }
      : await this.extractFromQuery(query, now, inventory);

    const candidates = await this.roomRepository.findMatching({
      status: RoomStatus.ACTIVE,
      minCapacity: extracted.capacity,
      building: extracted.building,
      floor: extracted.floor,
      equipments: extracted.equipment,
    });

    const start = new Date(extracted.startTime);
    const end = new Date(extracted.endTime);

    const verified: RecommendedRoom[] = [];
    for (const room of candidates) {
      const occupying = await this.bookingRepository.findOccupyingInRange(room.roomId, start, end);
      if (occupying.length > 0) {
        continue;
      }
      verified.push({
        roomId: room.roomId,
        name: room.name,
        capacity: room.capacity,
        building: room.building,
        floor: room.floor,
        equipments: room.equipments,
      });
    }

    const rooms = rankRecommendedRooms(verified, extracted.building);

    return {
      extracted,
      extractionSource: source,
      rooms,
      explanation: buildRecommendationExplanation({
        count: rooms.length,
        capacity: extracted.capacity,
        startTime: extracted.startTime,
        endTime: extracted.endTime,
        equipment: extracted.equipment,
        building: extracted.building,
      }),
    };
  }

  private async extractFromQuery(
    query: string,
    now: Date,
    inventory: ReturnType<typeof collectInventory>,
  ): Promise<{ extracted: ExtractedRequirements; source: ExtractionSource }> {
    const attempt = await this.extractor.extract(query, {
      now,
      inventory: {
        equipment: inventory.equipments,
        buildings: inventory.buildings,
        floors: inventory.floors,
      },
    });

    let extracted = this.tryValidate(pickConstraints(attempt.constraints, inventory, query));
    let source = attempt.source;

    if (!extracted && source === 'llm') {
      const fallback = extractRequirements(query, now);
      extracted = this.tryValidate(pickConstraints(fallback, inventory, query));
      source = 'fallback';
    }

    if (!extracted) {
      extracted = this.validateExtracted(pickConstraints(attempt.constraints, inventory, query));
    }

    return { extracted, source };
  }

  private tryValidate(input: unknown): ExtractedRequirements | null {
    const parsed = ExtractedRequirementsSchema.safeParse(input);
    return parsed.success ? parsed.data : null;
  }

  private validateExtracted(input: unknown): ExtractedRequirements {
    try {
      return ExtractedRequirementsSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError('Validation failed', error.issues);
      }
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();
