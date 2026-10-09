import { describe, expect, it } from 'vitest';
import { AnalyticsRangeSchema } from '../../../src/validators/analytics.validator';

describe('AnalyticsRangeSchema', () => {
  it('requires both startDate and endDate', () => {
    const result = AnalyticsRangeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects endDate that is not after startDate', () => {
    const result = AnalyticsRangeSchema.safeParse({
      startDate: '2030-01-02T00:00:00.000Z',
      endDate: '2030-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts an explicit ISO range', () => {
    const result = AnalyticsRangeSchema.safeParse({
      startDate: '2030-01-01T00:00:00.000Z',
      endDate: '2030-01-31T23:59:59.000Z',
    });
    expect(result.success).toBe(true);
  });
});
