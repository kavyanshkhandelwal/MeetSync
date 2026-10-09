import { describe, expect, it } from 'vitest';
import {
  extractRequirements,
  UNRESOLVABLE_TIME_MESSAGE,
} from '../../../src/domain/recommendation.extract';
import { BadRequestError } from '../../../src/utils/errors';

const NOW = new Date('2030-06-15T10:00:00.000Z');

describe('fallback requirement extractor', () => {
  it('extracts 8 people tomorrow at 3 PM with a projector in UTC', () => {
    const extracted = extractRequirements(
      '8 people tomorrow at 3 PM with a projector',
      NOW,
    );
    expect(extracted.capacity).toBe(8);
    expect(extracted.startTime).toBe('2030-06-16T15:00:00+00:00');
    expect(extracted.endTime).toBe('2030-06-16T16:00:00+00:00');
    expect(extracted.equipment).toEqual(['projector']);
  });

  it('extracts an explicit 12-hour range', () => {
    const extracted = extractRequirements(
      'Book a room for 12 people tomorrow from 2 PM to 3 PM with a projector.',
      NOW,
    );
    expect(extracted.capacity).toBe(12);
    expect(extracted.startTime).toBe('2030-06-16T14:00:00+00:00');
    expect(extracted.endTime).toBe('2030-06-16T15:00:00+00:00');
  });

  it('does not invent a 2–3 PM window for around 3 PM', () => {
    expect(() => extractRequirements('around 3 PM', NOW)).toThrow(BadRequestError);
    expect(() => extractRequirements('around 3 PM', NOW)).toThrow(UNRESOLVABLE_TIME_MESSAGE);
  });

  it('does not guess a time when none is specified', () => {
    expect(() => extractRequirements('8 people tomorrow with a projector', NOW)).toThrow(
      UNRESOLVABLE_TIME_MESSAGE,
    );
  });

  it('rejects an empty request', () => {
    expect(() => extractRequirements('')).toThrow(/required/i);
  });

  it('extracts a floor when present', () => {
    const extracted = extractRequirements('8 people tomorrow at 3 PM on the 5th floor', NOW);
    expect(extracted.floor).toBe(5);
  });
});
