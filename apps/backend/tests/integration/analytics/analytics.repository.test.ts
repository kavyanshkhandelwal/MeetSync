import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingStatus, RoomStatus } from '@prisma/client';

const bookingFindMany = vi.fn();
const bookingCount = vi.fn();
const bookingGroupBy = vi.fn();
const roomFindMany = vi.fn();
const roomCount = vi.fn();

vi.mock('../../../src/config/prisma', () => ({
  prisma: {
    booking: {
      findMany: (...args: unknown[]) => bookingFindMany(...args),
      count: (...args: unknown[]) => bookingCount(...args),
      groupBy: (...args: unknown[]) => bookingGroupBy(...args),
    },
    room: {
      findMany: (...args: unknown[]) => roomFindMany(...args),
      count: (...args: unknown[]) => roomCount(...args),
    },
  },
}));

import { AnalyticsRepository } from '../../../src/repositories/analytics.repository';
import { makeRoom } from '../../fixtures/rooms';

const range = {
  start: new Date('2030-01-01T00:00:00.000Z'),
  end: new Date('2030-01-02T00:00:00.000Z'),
};

describe('AnalyticsRepository (prisma-backed calculations)', () => {
  const repository = new AnalyticsRepository();

  beforeEach(() => {
    bookingFindMany.mockReset();
    bookingCount.mockReset();
    bookingGroupBy.mockReset();
    roomFindMany.mockReset();
    roomCount.mockReset();
  });

  it('counts overlapping usage bookings only', async () => {
    bookingCount.mockResolvedValueOnce(3);
    const total = await repository.getTotalBookings(range);
    expect(total).toBe(3);
    expect(bookingCount).toHaveBeenCalledWith({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        startTime: { lt: range.end },
        endTime: { gt: range.start },
      },
    });
  });

  it('calculates room utilization from clipped hours and ACTIVE availability', async () => {
    roomFindMany.mockResolvedValueOnce([
      makeRoom({ roomId: 'active', name: 'Active', status: RoomStatus.ACTIVE }),
      makeRoom({ roomId: 'maint', name: 'Maint', status: RoomStatus.MAINTENANCE }),
      makeRoom({ roomId: 'inactive', name: 'Inactive', status: RoomStatus.INACTIVE }),
    ]);
    bookingFindMany.mockResolvedValueOnce([
      {
        bookingId: 'b1',
        roomId: 'active',
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T12:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
      },
      {
        bookingId: 'b2',
        roomId: 'active',
        startTime: new Date('2030-01-01T08:00:00.000Z'),
        endTime: new Date('2030-01-01T09:00:00.000Z'),
        status: BookingStatus.COMPLETED,
      },
      {
        bookingId: 'b3',
        roomId: 'maint',
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        status: BookingStatus.COMPLETED,
      },
    ]);

    const rows = await repository.getRoomUtilization(range);
    const active = rows.find((row) => row.roomId === 'active')!;
    const maint = rows.find((row) => row.roomId === 'maint')!;
    const inactive = rows.find((row) => row.roomId === 'inactive')!;

    expect(active.totalBookedHours).toBe(3);
    expect(active.availableHours).toBe(24);
    expect(active.utilizationRate).toBe(12.5);
    expect(maint.totalBookedHours).toBe(1);
    expect(maint.availableHours).toBe(0);
    expect(maint.utilizationRate).toBe(0);
    expect(inactive.totalBookedHours).toBe(0);
    expect(inactive.availableHours).toBe(0);
    expect(inactive.utilizationRate).toBe(0);
  });

  it('clips bookings that cross the range boundary', async () => {
    roomFindMany.mockResolvedValueOnce([makeRoom({ roomId: 'active' })]);
    bookingFindMany.mockResolvedValueOnce([
      {
        bookingId: 'cross',
        roomId: 'active',
        startTime: new Date('2029-12-31T23:00:00.000Z'),
        endTime: new Date('2030-01-01T02:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
      },
    ]);
    const [row] = await repository.getRoomUtilization(range);
    expect(row.totalBookedHours).toBe(2);
    expect(row.utilizationRate).toBe(8.33);
  });

  it('returns zero utilization when there are no rooms', async () => {
    roomFindMany.mockResolvedValueOnce([]);
    bookingFindMany.mockResolvedValueOnce([]);
    await expect(repository.getRoomUtilization(range)).resolves.toEqual([]);
  });

  it('computes UTC peak hours and leaves empty periods at zero', async () => {
    bookingFindMany.mockResolvedValueOnce([
      {
        bookingId: 'night',
        roomId: 'active',
        startTime: new Date('2030-01-01T23:00:00.000Z'),
        endTime: new Date('2030-01-02T01:00:00.000Z'),
        status: BookingStatus.PENDING,
      },
    ]);
    const hourly = await repository.getPeakHours({
      start: new Date('2030-01-01T00:00:00.000Z'),
      end: new Date('2030-01-03T00:00:00.000Z'),
    });
    expect(hourly[23].count).toBe(1);
    expect(hourly[0].count).toBe(1);
    expect(hourly[10].count).toBe(0);
    expect(hourly[23].label).toContain('UTC');
  });

  it('ranks most-used rooms by booking count, not duration', async () => {
    bookingGroupBy.mockResolvedValueOnce([
      { roomId: 'short-many', _count: { bookingId: 3 } },
      { roomId: 'long-one', _count: { bookingId: 1 } },
    ]);
    roomFindMany.mockResolvedValueOnce([
      makeRoom({ roomId: 'short-many', name: 'Quick' }),
      makeRoom({ roomId: 'long-one', name: 'Long' }),
    ]);
    const ranked = await repository.getMostBookedRooms(10, range);
    expect(ranked.map((row) => row.roomId)).toEqual(['short-many', 'long-one']);
    expect(ranked[0].totalBookings).toBe(3);
  });

  it('returns an empty most-booked list when there are no usage bookings', async () => {
    bookingGroupBy.mockResolvedValueOnce([]);
    roomFindMany.mockResolvedValueOnce([]);
    await expect(repository.getMostBookedRooms(10, range)).resolves.toEqual([]);
  });
});
