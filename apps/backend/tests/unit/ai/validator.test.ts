import { describe, expect, it } from 'vitest';
import { ExtractedRequirementsSchema, RecommendQuerySchema } from '../../../src/validators/ai.validator';

describe('recommendation request validation', () => {
  it('rejects an empty query', () => {
    expect(RecommendQuerySchema.safeParse({ query: '' }).success).toBe(false);
    expect(RecommendQuerySchema.safeParse({ query: '   ' }).success).toBe(false);
  });

  it('rejects a query longer than 500 characters', () => {
    expect(RecommendQuerySchema.safeParse({ query: 'a'.repeat(501) }).success).toBe(false);
  });

  it('rejects unknown request fields', () => {
    expect(RecommendQuerySchema.safeParse({ query: '8 people at 3 PM', extra: true }).success).toBe(
      false,
    );
  });

  it('accepts a non-empty query within the limit', () => {
    expect(RecommendQuerySchema.safeParse({ query: '8 people tomorrow at 3 PM' }).success).toBe(true);
  });

  it('accepts optional edited constraints that already satisfy the business rules', () => {
    expect(
      RecommendQuerySchema.safeParse({
        query: '8 people tomorrow at 3 PM',
        constraints: {
          capacity: 12,
          startTime: '2030-06-16T15:00:00+00:00',
          endTime: '2030-06-16T16:00:00+00:00',
          equipment: [],
          purpose: 'Planning workshop',
        },
      }).success,
    ).toBe(true);
  });

  it('rejects invalid edited constraints on the request', () => {
    expect(
      RecommendQuerySchema.safeParse({
        query: '8 people tomorrow at 3 PM',
        constraints: {
          capacity: 0,
          startTime: '2030-06-16T15:00:00+00:00',
          endTime: '2030-06-16T16:00:00+00:00',
          equipment: [],
        },
      }).success,
    ).toBe(false);
  });
});

describe('extracted requirement validation', () => {
  const futureStart = '2030-06-16T15:00:00+00:00';
  const futureEnd = '2030-06-16T16:00:00+00:00';

  it('rejects invalid capacity', () => {
    expect(
      ExtractedRequirementsSchema.safeParse({
        capacity: 0,
        startTime: futureStart,
        endTime: futureEnd,
        equipment: [],
      }).success,
    ).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(
      ExtractedRequirementsSchema.safeParse({
        capacity: 8,
        startTime: 'not-a-date',
        endTime: futureEnd,
        equipment: [],
      }).success,
    ).toBe(false);
  });

  it('rejects inverted times', () => {
    expect(
      ExtractedRequirementsSchema.safeParse({
        capacity: 8,
        startTime: futureEnd,
        endTime: futureStart,
        equipment: [],
      }).success,
    ).toBe(false);
  });

  it('rejects duration under 15 minutes', () => {
    expect(
      ExtractedRequirementsSchema.safeParse({
        capacity: 8,
        startTime: '2030-06-16T15:00:00+00:00',
        endTime: '2030-06-16T15:10:00+00:00',
        equipment: [],
      }).success,
    ).toBe(false);
  });

  it('rejects duration over 8 hours', () => {
    expect(
      ExtractedRequirementsSchema.safeParse({
        capacity: 8,
        startTime: '2030-06-16T08:00:00+00:00',
        endTime: '2030-06-16T17:00:00+00:00',
        equipment: [],
      }).success,
    ).toBe(false);
  });

  it('rejects a start time in the past', () => {
    expect(
      ExtractedRequirementsSchema.safeParse({
        capacity: 8,
        startTime: '2020-01-01T15:00:00+00:00',
        endTime: '2020-01-01T16:00:00+00:00',
        equipment: [],
      }).success,
    ).toBe(false);
  });
});
