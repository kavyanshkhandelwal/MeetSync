import { RawExtractedRequirements } from '../../domain/recommendation.extract';

export type ExtractionSource = 'llm' | 'fallback';

export type ExtractionInventory = {
  equipment: string[];
  buildings: string[];
  floors: number[];
};

export type ExtractionContext = {
  now: Date;
  inventory: ExtractionInventory;
};

export type ExtractionResult = {
  constraints: RawExtractedRequirements;
  source: ExtractionSource;
};

export interface ConstraintExtractor {
  extract(query: string, context: ExtractionContext): Promise<ExtractionResult>;
}
