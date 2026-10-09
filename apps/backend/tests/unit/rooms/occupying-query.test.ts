import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('availability occupying query', () => {
  it('occupies only PENDING and CONFIRMED bookings', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/repositories/booking.repository.ts'),
      'utf8',
    );
    expect(source).toContain('OCCUPYING_STATUSES');
    expect(source).toContain('BookingStatus.PENDING');
    expect(source).toContain('BookingStatus.CONFIRMED');
    expect(source).toContain('findOccupyingInRange');
    expect(source).toContain('bookingRangeOverlap');
    expect(source).toContain('occupyingStatusFilter');
    expect(source).toContain('checkForConflictingBookingInTransaction');
  });
});
