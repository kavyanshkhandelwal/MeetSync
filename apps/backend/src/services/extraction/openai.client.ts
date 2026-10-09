import OpenAI from 'openai';
import { env } from '../../config';
import { LLM_CONSTRAINT_JSON_SCHEMA } from '../../validators/ai.validator';

export type StructuredExtractRequest = {
  system: string;
  user: string;
};

export type StructuredExtractFn = (request: StructuredExtractRequest) => Promise<unknown>;

export function isOpenAiConfigured(apiKey: string = env.OPENAI_API_KEY): boolean {
  return apiKey.trim().length > 0;
}

export function createOpenAiStructuredExtractFn(): StructuredExtractFn {
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
    timeout: env.OPENAI_TIMEOUT_MS,
    maxRetries: 0,
  });

  return async (request: StructuredExtractRequest) => {
    const completion = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'meeting_constraints',
          strict: true,
          schema: LLM_CONSTRAINT_JSON_SCHEMA,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('empty_model_content');
    }
    return JSON.parse(content);
  };
}
