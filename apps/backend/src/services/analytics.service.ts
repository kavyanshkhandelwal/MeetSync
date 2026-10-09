import { BadRequestError } from '../utils/errors';
import { AnalyticsRepository, AnalyticsRange } from '../repositories/analytics.repository';
import { overallUtilizationPercent, selectPeakHour } from '../domain/analytics.math';

export class AnalyticsService {
  private analyticsRepository: AnalyticsRepository;

  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
  }

  parseRange(startDate?: string, endDate?: string): AnalyticsRange {
    if (!startDate || !endDate) {
      throw new BadRequestError('startDate and endDate are required');
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new BadRequestError('endDate must be after startDate');
    }
    return { start, end };
  }

  async getDashboardAnalytics(startDate?: string, endDate?: string) {
    const range = this.parseRange(startDate, endDate);
    const raw = await this.analyticsRepository.getDashboardAnalytics(range);
    const peak = selectPeakHour(raw.hourlyBreakdown);
    const averageUtilization = overallUtilizationPercent(
      raw.roomUtilization.map((room) => ({
        bookedHours: room.totalBookedHours,
        availableHours: room.availableHours,
      })),
    );

    return {
      ...raw,
      averageUtilization,
      peakHour: peak?.hour ?? null,
      peakHourLabel: peak?.label ?? null,
      peakHourBookings: peak?.count ?? 0,
      period: { startDate, endDate, timeZone: 'UTC' },
    };
  }

  async getTotalBookings(startDate?: string, endDate?: string) {
    const range = this.parseRange(startDate, endDate);
    const count = await this.analyticsRepository.getTotalBookings(range);
    return {
      totalBookings: count,
      period: { startDate, endDate, timeZone: 'UTC' },
    };
  }

  async getRoomUtilization(startDate?: string, endDate?: string) {
    const range = this.parseRange(startDate, endDate);
    const roomUtilization = await this.analyticsRepository.getRoomUtilization(range);
    const averageUtilization = overallUtilizationPercent(
      roomUtilization.map((room) => ({
        bookedHours: room.totalBookedHours,
        availableHours: room.availableHours,
      })),
    );

    return {
      averageUtilization,
      roomUtilization,
      period: { startDate, endDate, timeZone: 'UTC' },
    };
  }

  async getPeakHours(startDate?: string, endDate?: string) {
    const range = this.parseRange(startDate, endDate);
    const hourlyBreakdown = await this.analyticsRepository.getPeakHours(range);
    const peak = selectPeakHour(hourlyBreakdown);

    return {
      peakHour: peak?.hour ?? null,
      peakHourLabel: peak?.label ?? null,
      peakHourBookings: peak?.count ?? 0,
      hourlyBreakdown,
      period: { startDate, endDate, timeZone: 'UTC' },
    };
  }

  async getMostBookedRooms(limit?: number, startDate?: string, endDate?: string) {
    const range = this.parseRange(startDate, endDate);
    const rooms = await this.analyticsRepository.getMostBookedRooms(limit || 10, range);
    return {
      mostBookedRooms: rooms,
      ranking: 'booking_count' as const,
      period: { startDate, endDate, timeZone: 'UTC' },
    };
  }
}
