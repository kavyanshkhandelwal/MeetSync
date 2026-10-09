import { ConstraintExtractor, ExtractionContext, ExtractionResult } from './types';
import { FallbackConstraintExtractor } from './fallback.extractor';
import { OpenAiConstraintExtractor } from './openai.extractor';

export class HybridConstraintExtractor implements ConstraintExtractor {
  constructor(
    private readonly fallback: FallbackConstraintExtractor,
    private readonly llm?: OpenAiConstraintExtractor,
  ) {}

  async extract(query: string, context: ExtractionContext): Promise<ExtractionResult> {
    if (this.llm) {
      const constraints = await this.llm.tryExtract(query, context);
      if (constraints) {
        return { constraints, source: 'llm' };
      }
    }
    return this.fallback.extract(query, context);
  }
}
