import { extractRequirements, RawExtractedRequirements } from '../../domain/recommendation.extract';
import { ConstraintExtractor, ExtractionContext, ExtractionResult } from './types';

export class FallbackConstraintExtractor implements ConstraintExtractor {
  extract(query: string, context: ExtractionContext): Promise<ExtractionResult> {
    const constraints: RawExtractedRequirements = extractRequirements(query, context.now);
    return Promise.resolve({ constraints, source: 'fallback' });
  }
}
