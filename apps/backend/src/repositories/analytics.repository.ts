import { Prisma, RoomStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  ANALYTICS_BOOKING_STATUSES,
  incrementUtcDayCounts,
  incrementUtcHourBuckets,
  isRoomAvailableForUtilization,
  mergedClippedHours,
  rangeHours,
  utilizationPercent,
} from '../domain/analytics.math';

export type AnalyticsRange = {
  start: Date;
  end: Date;
};

/** Overlap (not containment): booking.start < rangeEnd AND booking.end > rangeStart. */
export function analyticsUsageWhere(range: AnalyticsRange): Prisma.BookingWhereInput {
  return {
    status: { in: ANALYTICS_BOOKING_STATUSES },
    startTime: { lt: range.end },
    endTime: { gt: range.start },
  };
}

export class AnalyticsRepository {
  async getUsageBookings(range: AnalyticsRange) {
    return prisma.booking.findMany({
      where: analyticsUsageWhere(range),
      select: {
        bookingId: true,
        roomId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });
  }

  async getTotalBookings(range: AnalyticsRange): Promise<number> {
    return prisma.booking.count({ where: analyticsUsageWhere(range) });
  }

  async getRoomUtilization(range: AnalyticsRange) {
    const [rooms, bookings] = await Promise.all([
      prisma.room.findMany(),
      this.getUsageBookings(range),
    ]);

    const availableHours = rangeHours(range.start, range.end);

    return rooms.map((room) => {
      const roomBookings = bookings.filter((booking) => booking.roomId === room.roomId);
      const bookedHours = mergedClippedHours(
        roomBookings.map((booking) => ({ start: booking.startTime, end: booking.endTime })),
        range.start,
        range.end,
      );
      const roomAvailable = isRoomAvailableForUtilization(room.status) ? availableHours : 0;

      return {
        roomId: room.roomId,
        roomName: room.name,
        capacity: room.capacity,
        building: room.building,
        floor: room.floor,
        status: room.status,
        totalBookings: roomBookings.length,
        totalBookedHours: parseFloat(bookedHours.toFixed(2)),
        availableHours: parseFloat(roomAvailable.toFixed(2)),
        utilizationRate: utilizationPercent(bookedHours, roomAvailable),
      };
    });
  }

  async getPeakHours(range: AnalyticsRange) {
    const bookings = await this.getUsageBookings(range);
    const hourCounts = new Array(24).fill(0);

    bookings.forEach((booking) => {
      const clippedStart = new Date(Math.max(booking.startTime.getTime(), range.start.getTime()));
      const clippedEnd = new Date(Math.min(booking.endTime.getTime(), range.end.getTime()));
      if (clippedEnd > clippedStart) {
        incrementUtcHourBuckets(hourCounts, clippedStart, clippedEnd);
      }
    });

    return hourCounts.map((count, hour) => ({
      hour,
      count,
      label: `${String(hour).padStart(2, '0')}:00 UTC`,
    }));
  }

  async getMostBookedRooms(limit: number, range: AnalyticsRange) {
    const roomBookings = await prisma.booking.groupBy({
      by: ['roomId'],
      where: analyticsUsageWhere(range),
      _count: { bookingId: true },
      orderBy: { _count: { bookingId: 'desc' } },
      take: limit,
    });

    const rooms = await prisma.room.findMany({
      where: { roomId: { in: roomBookings.map((row) => row.roomId) } },
    });

    return roomBookings.map((row) => {
      const room = rooms.find((item) => item.roomId === row.roomId);
      return {
        roomId: row.roomId,
        roomName: room?.name || 'Unknown',
        capacity: room?.capacity || 0,
        building: room?.building || '',
        floor: room?.floor || 0,
        totalBookings: row._count.bookingId || 0,
      };
    });
  }

  async getBookingsByDay(range: AnalyticsRange) {
    const bookings = await this.getUsageBookings(range);
    const counts = new Map<string, number>();
    bookings.forEach((booking) => {
      const clippedStart = new Date(Math.max(booking.startTime.getTime(), range.start.getTime()));
      const clippedEnd = new Date(Math.min(booking.endTime.getTime(), range.end.getTime()));
      if (clippedEnd > clippedStart) {
        incrementUtcDayCounts(counts, clippedStart, clippedEnd);
      }
    });
    return [...counts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDashboardAnalytics(range: AnalyticsRange) {
    const [totalBookings, totalRooms, totalActiveRooms, roomUtilization, hourlyBreakdown, mostBookedRooms, bookingsByDay] =
      await Promise.all([
        this.getTotalBookings(range),
        prisma.room.count(),
        prisma.room.count({ where: { status: RoomStatus.ACTIVE } }),
        this.getRoomUtilization(range),
        this.getPeakHours(range),
        this.getMostBookedRooms(5, range),
        this.getBookingsByDay(range),
      ]);

    return {
      totalBookings,
      totalRooms,
      totalActiveRooms,
      roomUtilization,
      hourlyBreakdown,
      mostBookedRooms,
      bookingsByDay,
    };
  }
}
