import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '../../../src');

function read(rel: string) {
  return fs.readFileSync(path.join(SRC, rel), 'utf8');
}

describe('recommendation architecture', () => {
  const service = read('services/recommendation.service.ts');
  const extract = read('domain/recommendation.extract.ts');
  const openaiExtractor = read('services/extraction/openai.extractor.ts');
  const openaiClient = read('services/extraction/openai.client.ts');

  it('does not query Prisma bookings or rooms directly', () => {
    expect(service).not.toMatch(/prisma\.booking/);
    expect(service).not.toMatch(/prisma\.room/);
    expect(extract).not.toMatch(/prisma\./);
  });

  it('does not create bookings', () => {
    expect(service).not.toMatch(/createBooking/);
    expect(service).not.toMatch(/booking\.create/);
    expect(service).not.toMatch(/prisma\.booking\.create/);
  });

  it('uses canonical occupying availability instead of status != CANCELLED', () => {
    expect(service).toContain('findOccupyingInRange');
    expect(service).not.toMatch(/not:\s*BookingStatus\.CANCELLED/);
    expect(service).not.toMatch(/not:\s*['"]CANCELLED['"]/);
    expect(extract).not.toMatch(/CANCELLED/);
  });

  it('reuses RoomRepository.findMatching instead of a private search', () => {
    expect(service).toContain('findMatching');
    expect(service).not.toMatch(/available:\s*true/);
  });

  it('does not embed OpenAI HTTP details in RecommendationService', () => {
    expect(service).not.toMatch(/from 'openai'|from "openai"/);
    expect(service).not.toMatch(/OPENAI_API_KEY/);
    expect(service).toContain('extractionSource');
    expect(service).toContain('extractor');
  });

  it('does not expose an AI booking endpoint', () => {
    const routes = read('routes/ai.routes.ts');
    const index = read('routes/index.ts');
    expect(routes).toContain('/recommend');
    expect(routes).not.toMatch(/['"`]\/book['"`]/);
    expect(index).not.toContain('/ai/book');
  });

  it('keeps the OpenAI client out of Prisma and booking writes', () => {
    expect(openaiExtractor).not.toMatch(/prisma/);
    expect(openaiClient).not.toMatch(/prisma/);
    expect(openaiExtractor).not.toMatch(/booking\.create|createBooking/);
    expect(openaiClient).not.toMatch(/booking\.create|createBooking/);
    expect(openaiClient).toMatch(/maxRetries:\s*0/);
  });
});
