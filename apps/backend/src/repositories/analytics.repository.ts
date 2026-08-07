import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class AnalyticsRepository {
  /**
   * Get total bookings count with optional filters
   */
  async getTotalBookings(startDate?: Date, endDate?: Date): Promise<number> {
    const where: Prisma.BookingWhereInput = {
      status: { not: BookingStatus.CANCELLED },
    };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    return prisma.booking.count({ where });
  }

  /**
   * Get room utilization metrics
   */
  async getRoomUtilization(startDate?: Date, endDate?: Date): Promise<any[]> {
    const where: Prisma.BookingWhereInput = {
      status: { not: BookingStatus.CANCELLED },
    };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    // Get all rooms with their booking counts
    const rooms = await prisma.room.findMany({
      include: {
        bookings: {
          where,
        },
      },
    });

    // Calculate utilization for each room
    return rooms.map(room => {
      const totalBookedHours = room.bookings.reduce((sum, booking) => {
        const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
        return sum + durationMs / (1000 * 60 * 60); // Convert to hours
      }, 0);

      // If date range provided, calculate total possible hours in period
      let totalPossibleHours = 0;
      if (startDate && endDate) {
        const durationMs = endDate.getTime() - startDate.getTime();
        totalPossibleHours = durationMs / (1000 * 60 * 60);
      }

      const utilizationRate = totalPossibleHours > 0 
        ? (totalBookedHours / totalPossibleHours) * 100 
        : 0;

      return {
        roomId: room.roomId,
        roomName: room.name,
        capacity: room.capacity,
        building: room.building,
        floor: room.floor,
        totalBookings: room.bookings.length,
        totalBookedHours: parseFloat(totalBookedHours.toFixed(2)),
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      };
    });
  }

  /**
   * Get peak booking hours
   */
  async getPeakHours(startDate?: Date, endDate?: Date): Promise<any[]> {
    const where: Prisma.BookingWhereInput = {
      status: { not: BookingStatus.CANCELLED },
    };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: { startTime: true, endTime: true },
    });

    // Initialize hour buckets (0-23)
    const hourCounts = new Array(24).fill(0);

    bookings.forEach(booking => {
      let current = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      while (current < end) {
        const hour = current.getHours();
        hourCounts[hour]++;

        // Move to next hour
        current.setHours(current.getHours() + 1);
        current.setMinutes(0, 0, 0);
      }
    });

    // Format results
    return hourCounts.map((count, hour) => ({
      hour,
      count,
      label: `${hour}:00`,
    }));
  }

  /**
   * Get most booked rooms
   */
  async getMostBookedRooms(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    const where: Prisma.BookingWhereInput = {
      status: { not: BookingStatus.CANCELLED },
    };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    // Group bookings by room and count
    const roomBookings = await prisma.booking.groupBy({
      by: ['roomId'],
      where,
      _count: {
        bookingId: true,
      },
      orderBy: {
        _count: {
          bookingId: 'desc',
        },
      },
      take: limit,
    });

    // Get room details
    const roomIds = roomBookings.map(rb => rb.roomId);
    const rooms = await prisma.room.findMany({
      where: {
        roomId: { in: roomIds },
      },
    });

    // Combine data
    return roomBookings.map(rb => {
      const room = rooms.find(r => r.roomId === rb.roomId);
      return {
        roomId: rb.roomId,
        roomName: room?.name || 'Unknown',
        capacity: room?.capacity || 0,
        building: room?.building || '',
        floor: room?.floor || 0,
        totalBookings: rb._count.bookingId || 0,
      };
    });
  }

  /**
   * Get comprehensive analytics dashboard data in one query batch
   */
  async getDashboardAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const where: Prisma.BookingWhereInput = {
      status: { not: BookingStatus.CANCELLED },
    };

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startTime: { gte: startDate } });
      }
      if (endDate) {
        where.AND.push({ endTime: { lte: endDate } });
      }
    }

    // Run all queries in parallel for optimization
    const [
      totalBookings,
      totalRooms,
      totalActiveRooms,
      bookings,
      mostBooked,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.room.count(),
      prisma.room.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.findMany({
        where,
        select: { startTime: true, endTime: true, roomId: true },
      }),
      prisma.booking.groupBy({
        by: ['roomId'],
        where,
        _count: { bookingId: true },
        orderBy: { _count: { bookingId: 'desc' } },
        take: 5,
      }),
    ]);

    // Calculate peak hours
    const hourCounts = new Array(24).fill(0);
    bookings.forEach(booking => {
      let current = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      while (current < end) {
        hourCounts[current.getHours()]++;
        current.setHours(current.getHours() + 1);
        current.setMinutes(0, 0, 0);
      }
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Get top rooms details
    const topRoomIds = mostBooked.map(rb => rb.roomId); 
    const topRooms = await prisma.room.findMany({
      where: { roomId: { in: topRoomIds } },  
    });

    const mostBookedRooms = mostBooked.map(rb => {
      const room = topRooms.find(r => r.roomId === rb.roomId);
      return {
        roomId: rb.roomId,
        roomName: room?.name || 'Unknown',
        totalBookings: rb._count.bookingId || 0,
      };
    });

    return {
      totalBookings,
      totalRooms,
      totalActiveRooms,
      peakHour,
      peakHourLabel: `${peakHour}:00`,
      peakHourBookings: hourCounts[peakHour],
      mostBookedRooms,
      hourlyBreakdown: hourCounts.map((count, hour) => ({
        hour,
        count,
      })),
    };
  }
}
