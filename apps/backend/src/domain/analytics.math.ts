import { BookingStatus, RoomStatus } from '@prisma/client';

/**
 * Analytics semantics (historical usage, not conflict occupancy).
 *
 * Utilization = merged clipped booked hours ÷ available hours × 100.
 * Booked: PENDING + CONFIRMED + COMPLETED, clipped to the requested range.
 * CANCELLED never contributes.
 * COMPLETED counts here but does not block future bookings (see OCCUPYING_STATUSES).
 * Available hours: range duration for ACTIVE rooms only.
 * INACTIVE and MAINTENANCE contribute 0 available hours (rate 0).
 * Capacity is reported, not used in the rate (time-based, not seat-weighted).
 * Hour and day buckets use UTC, never the server local timezone.
 * Overall utilization is booked÷available across rooms, not the mean of rates.
 */
export const ANALYTICS_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

export function isAnalyticsBookingStatus(status: BookingStatus): boolean {
  return ANALYTICS_BOOKING_STATUSES.includes(status);
}

export function isRoomAvailableForUtilization(status: RoomStatus): boolean {
  return status === RoomStatus.ACTIVE;
}

export function clipIntervalMs(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const clippedStart = Math.max(start.getTime(), rangeStart.getTime());
  const clippedEnd = Math.min(end.getTime(), rangeEnd.getTime());
  return Math.max(0, clippedEnd - clippedStart);
}

export function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

export function rangeHours(rangeStart: Date, rangeEnd: Date): number {
  return msToHours(Math.max(0, rangeEnd.getTime() - rangeStart.getTime()));
}

/** bookedHours / availableHours * 100. 0 when the room is not available. */
export function utilizationPercent(bookedHours: number, availableHours: number): number {
  if (availableHours <= 0) {
    return 0;
  }
  return parseFloat(((bookedHours / availableHours) * 100).toFixed(2));
}

export function overallUtilizationPercent(
  rooms: Array<{ bookedHours: number; availableHours: number }>,
): number {
  const booked = rooms.reduce((sum, room) => sum + room.bookedHours, 0);
  const available = rooms.reduce((sum, room) => sum + room.availableHours, 0);
  return utilizationPercent(booked, available);
}

export function incrementUtcHourBuckets(
  counts: number[],
  rangeStart: Date,
  rangeEnd: Date,
): void {
  let cursor = rangeStart.getTime();
  const endMs = rangeEnd.getTime();
  while (cursor < endMs) {
    const hour = new Date(cursor).getUTCHours();
    counts[hour] += 1;
    const next = new Date(cursor);
    cursor = Date.UTC(
      next.getUTCFullYear(),
      next.getUTCMonth(),
      next.getUTCDate(),
      next.getUTCHours() + 1,
      0,
      0,
      0,
    );
  }
}

export function selectPeakHour(
  hourly: Array<{ hour: number; count: number; label: string }>,
): { hour: number; label: string; count: number } | null {
  if (hourly.length === 0 || hourly.every((row) => row.count === 0)) {
    return null;
  }
  return hourly.reduce((max, row) => (row.count > max.count ? row : max), hourly[0]);
}

export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type TimeInterval = { start: Date; end: Date };

/** Merge overlapping clipped intervals so the same room-time is never counted twice. */
export function mergedClippedHours(
  intervals: TimeInterval[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const clipped = intervals
    .map((interval) => ({
      start: Math.max(interval.start.getTime(), rangeStart.getTime()),
      end: Math.min(interval.end.getTime(), rangeEnd.getTime()),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);

  if (clipped.length === 0) {
    return 0;
  }

  const merged: Array<{ start: number; end: number }> = [{ ...clipped[0] }];
  for (let i = 1; i < clipped.length; i += 1) {
    const current = clipped[i];
    const last = merged[merged.length - 1];
    if (current.start > last.end) {
      merged.push({ ...current });
    } else {
      last.end = Math.max(last.end, current.end);
    }
  }

  return merged.reduce((sum, interval) => sum + msToHours(interval.end - interval.start), 0);
}

/** Count a booking once on each UTC calendar day it overlaps. */
export function incrementUtcDayCounts(
  counts: Map<string, number>,
  rangeStart: Date,
  rangeEnd: Date,
): void {
  const startUtc = Date.UTC(
    rangeStart.getUTCFullYear(),
    rangeStart.getUTCMonth(),
    rangeStart.getUTCDate(),
  );
  const endMs = rangeEnd.getTime();
  for (let cursor = startUtc; cursor < endMs; cursor += 24 * 60 * 60 * 1000) {
    const key = utcDateKey(new Date(cursor));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}
