import { describe, expect, it } from 'vitest';
import { extractRequirements } from '../../../src/domain/recommendation.extract';

const NOW = new Date('2030-06-15T10:00:00.000Z');
const QUERY = 'Book a room for 12 people tomorrow from 2 PM to 3 PM with a projector.';

describe('fallback parser scenario: 12 people, tomorrow 2–3 PM, projector', () => {
  it('extracts date, time, capacity, and equipment', () => {
    const extracted = extractRequirements(QUERY, NOW);
    expect(extracted.capacity).toBe(12);
    expect(extracted.equipment.some((item) => /projector/i.test(item))).toBe(true);
    expect(extracted.startTime).toBe('2030-06-16T14:00:00+00:00');
    expect(extracted.endTime).toBe('2030-06-16T15:00:00+00:00');
  });

  it('rejects an empty request', () => {
    expect(() => extractRequirements('')).toThrow(/required/i);
  });
});
