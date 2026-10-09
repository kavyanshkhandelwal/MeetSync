import { env } from '../../config';
import { HybridConstraintExtractor } from './hybrid.extractor';
import { FallbackConstraintExtractor } from './fallback.extractor';
import { OpenAiConstraintExtractor } from './openai.extractor';
import { createOpenAiStructuredExtractFn, isOpenAiConfigured } from './openai.client';
import { ConstraintExtractor } from './types';

export function createDefaultExtractor(): ConstraintExtractor {
  const fallback = new FallbackConstraintExtractor();
  // Tests never call the live provider, even if a local .env defines a key.
  if (env.NODE_ENV === 'test' || !isOpenAiConfigured()) {
    return fallback;
  }
  return new HybridConstraintExtractor(fallback, new OpenAiConstraintExtractor(createOpenAiStructuredExtractFn()));
}
