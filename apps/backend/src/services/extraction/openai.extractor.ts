import { logger } from '../../utils/logger';
import {
  buildConstraintUserPrompt,
  CONSTRAINT_EXTRACTION_SYSTEM_PROMPT,
} from '../../prompts/room-recommendation';
import { LlmConstraintSchema } from '../../validators/ai.validator';
import { RawExtractedRequirements } from '../../domain/recommendation.extract';
import { ExtractionContext } from './types';
import { StructuredExtractFn } from './openai.client';

export class OpenAiConstraintExtractor {
  constructor(private readonly complete: StructuredExtractFn) {}

  async tryExtract(query: string, context: ExtractionContext): Promise<RawExtractedRequirements | null> {
    try {
      const raw = await this.complete({
        system: CONSTRAINT_EXTRACTION_SYSTEM_PROMPT,
        user: buildConstraintUserPrompt({
          query,
          nowIso: context.now.toISOString(),
          equipment: context.inventory.equipment,
          buildings: context.inventory.buildings,
          floors: context.inventory.floors,
        }),
      });
      const parsed = LlmConstraintSchema.safeParse(raw);
      if (!parsed.success) {
        return null;
      }
      return {
        capacity: parsed.data.capacity,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        equipment: parsed.data.equipment,
        building: parsed.data.building ?? undefined,
        floor: parsed.data.floor ?? undefined,
        purpose: parsed.data.purpose ?? undefined,
      };
    } catch (error) {
      logger.warn(
        `Constraint extraction via OpenAI failed; using fallback parser (${error instanceof Error ? error.name : 'unknown'})`,
      );
      return null;
    }
  }
}
