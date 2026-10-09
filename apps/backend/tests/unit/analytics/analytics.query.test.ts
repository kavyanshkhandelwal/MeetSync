import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BookingStatus } from '@prisma/client';
import { ANALYTICS_BOOKING_STATUSES } from '../../../src/domain/analytics.math';
import { OCCUPYING_STATUSES } from '../../../src/repositories/booking.repository';
import { analyticsUsageWhere } from '../../../src/repositories/analytics.repository';

describe('analytics query contract', () => {
  const repoSrc = fs.readFileSync(
    path.resolve(__dirname, '../../../src/repositories/analytics.repository.ts'),
    'utf8',
  );
  const mathSrc = fs.readFileSync(
    path.resolve(__dirname, '../../../src/domain/analytics.math.ts'),
    'utf8',
  );

  it('uses overlap predicates, not containment', () => {
    const where = analyticsUsageWhere({
      start: new Date('2030-01-01T00:00:00.000Z'),
      end: new Date('2030-01-02T00:00:00.000Z'),
    });
    expect(where.startTime).toEqual({ lt: new Date('2030-01-02T00:00:00.000Z') });
    expect(where.endTime).toEqual({ gt: new Date('2030-01-01T00:00:00.000Z') });
    expect(repoSrc).not.toMatch(/startTime:\s*\{\s*gte:/);
    expect(repoSrc).not.toMatch(/endTime:\s*\{\s*lte:/);
  });

  it('includes COMPLETED for history and excludes CANCELLED', () => {
    expect(ANALYTICS_BOOKING_STATUSES).toContain(BookingStatus.COMPLETED);
    expect(ANALYTICS_BOOKING_STATUSES).not.toContain(BookingStatus.CANCELLED);
    expect(OCCUPYING_STATUSES).not.toContain(BookingStatus.COMPLETED);
  });

  it('never reads the server local hour for peak buckets', () => {
    expect(mathSrc).toMatch(/getUTCHours/);
    expect(mathSrc).not.toMatch(/\.getHours\(/);
    expect(repoSrc).not.toMatch(/\.getHours\(/);
  });
});
