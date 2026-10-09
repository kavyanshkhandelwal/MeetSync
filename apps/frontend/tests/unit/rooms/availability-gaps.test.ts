import { describe, expect, it } from 'vitest';
import { buildAvailableGaps } from '../../../src/components/rooms/availability-panel';

const dayStart = new Date('2030-01-01T00:00:00.000Z');
const dayEnd = new Date('2030-01-02T00:00:00.000Z');

describe('buildAvailableGaps', () => {
  it('returns the full day when there are no bookings', () => {
    expect(buildAvailableGaps(dayStart, dayEnd, [])).toEqual([{ start: dayStart, end: dayEnd }]);
  });

  it('splits around a booked interval', () => {
    const gaps = buildAvailableGaps(dayStart, dayEnd, [
      {
        bookingId: 'b1',
        startTime: '2030-01-01T10:00:00.000Z',
        endTime: '2030-01-01T11:00:00.000Z',
        status: 'PENDING',
        purpose: 'Standup',
      },
    ]);
    expect(gaps).toHaveLength(2);
    expect(gaps[0].end.toISOString()).toBe('2030-01-01T10:00:00.000Z');
    expect(gaps[1].start.toISOString()).toBe('2030-01-01T11:00:00.000Z');
  });

  it('renders an empty available list when the day is fully booked', () => {
    const gaps = buildAvailableGaps(dayStart, dayEnd, [
      {
        bookingId: 'b1',
        startTime: '2030-01-01T00:00:00.000Z',
        endTime: '2030-01-02T00:00:00.000Z',
        status: 'CONFIRMED',
        purpose: 'All day',
      },
    ]);
    expect(gaps).toEqual([]);
  });
});
