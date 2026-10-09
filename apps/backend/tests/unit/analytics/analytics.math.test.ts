import { describe, expect, it } from 'vitest';
import { BookingStatus, RoomStatus } from '@prisma/client';
import {
  ANALYTICS_BOOKING_STATUSES,
  clipIntervalMs,
  incrementUtcDayCounts,
  incrementUtcHourBuckets,
  isAnalyticsBookingStatus,
  isRoomAvailableForUtilization,
  mergedClippedHours,
  msToHours,
  overallUtilizationPercent,
  rangeHours,
  selectPeakHour,
  utilizationPercent,
} from '../../../src/domain/analytics.math';

describe('analytics math', () => {
  it('counts PENDING, CONFIRMED, and COMPLETED only', () => {
    expect(ANALYTICS_BOOKING_STATUSES).toEqual([
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
    ]);
    expect(isAnalyticsBookingStatus(BookingStatus.CANCELLED)).toBe(false);
    expect(isAnalyticsBookingStatus(BookingStatus.COMPLETED)).toBe(true);
  });

  it('treats only ACTIVE rooms as available for utilization', () => {
    expect(isRoomAvailableForUtilization(RoomStatus.ACTIVE)).toBe(true);
    expect(isRoomAvailableForUtilization(RoomStatus.INACTIVE)).toBe(false);
    expect(isRoomAvailableForUtilization(RoomStatus.MAINTENANCE)).toBe(false);
  });

  it('clips a booking that starts before the range', () => {
    const ms = clipIntervalMs(
      new Date('2030-01-01T22:00:00.000Z'),
      new Date('2030-01-02T02:00:00.000Z'),
      new Date('2030-01-02T00:00:00.000Z'),
      new Date('2030-01-03T00:00:00.000Z'),
    );
    expect(msToHours(ms)).toBe(2);
  });

  it('does not double-count overlapping booked intervals', () => {
    const hours = mergedClippedHours(
      [
        { start: new Date('2030-01-01T10:00:00.000Z'), end: new Date('2030-01-01T12:00:00.000Z') },
        { start: new Date('2030-01-01T11:00:00.000Z'), end: new Date('2030-01-01T13:00:00.000Z') },
      ],
      new Date('2030-01-01T00:00:00.000Z'),
      new Date('2030-01-02T00:00:00.000Z'),
    );
    expect(hours).toBe(3);
  });

  it('computes utilization as booked ÷ available × 100', () => {
    expect(utilizationPercent(2, 24)).toBe(8.33);
    expect(utilizationPercent(0, 24)).toBe(0);
    expect(utilizationPercent(5, 0)).toBe(0);
  });

  it('weights overall utilization by available hours, not the mean of rates', () => {
    const weighted = overallUtilizationPercent([
      { bookedHours: 4, availableHours: 10 },
      { bookedHours: 0, availableHours: 100 },
    ]);
    expect(weighted).toBe(3.64);
  });

  it('returns 0 overall utilization with no rooms or no available hours', () => {
    expect(overallUtilizationPercent([])).toBe(0);
    expect(overallUtilizationPercent([{ bookedHours: 2, availableHours: 0 }])).toBe(0);
  });

  it('uses a 24-hour range as 24 available hours', () => {
    expect(
      rangeHours(new Date('2030-01-01T00:00:00.000Z'), new Date('2030-01-02T00:00:00.000Z')),
    ).toBe(24);
  });

  it('buckets peak hours in UTC, including midnight crossings', () => {
    const counts = new Array(24).fill(0);
    incrementUtcHourBuckets(
      counts,
      new Date('2030-06-15T23:00:00.000Z'),
      new Date('2030-06-16T01:00:00.000Z'),
    );
    expect(counts[23]).toBe(1);
    expect(counts[0]).toBe(1);
    expect(counts[22]).toBe(0);
    expect(counts[1]).toBe(0);
  });

  it('does not invent a peak hour when every bucket is zero', () => {
    expect(
      selectPeakHour([
        { hour: 0, count: 0, label: '00:00 UTC' },
        { hour: 9, count: 0, label: '09:00 UTC' },
      ]),
    ).toBeNull();
  });

  it('selects the hour with the highest booking count', () => {
    const peak = selectPeakHour([
      { hour: 9, count: 2, label: '09:00 UTC' },
      { hour: 14, count: 7, label: '14:00 UTC' },
      { hour: 16, count: 3, label: '16:00 UTC' },
    ]);
    expect(peak).toEqual({ hour: 14, label: '14:00 UTC', count: 7 });
  });

  it('counts a midnight-crossing booking on each UTC day', () => {
    const counts = new Map<string, number>();
    incrementUtcDayCounts(
      counts,
      new Date('2030-01-01T23:00:00.000Z'),
      new Date('2030-01-02T01:00:00.000Z'),
    );
    expect(counts.get('2030-01-01')).toBe(1);
    expect(counts.get('2030-01-02')).toBe(1);
  });
});
