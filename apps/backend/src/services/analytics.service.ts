import { AnalyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsService {
  private analyticsRepository: AnalyticsRepository;

  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
  }

  /**
   * Get dashboard analytics with all metrics
   */
  async getDashboardAnalytics(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsRepository.getDashboardAnalytics(start, end);
  }

  /**
   * Get total bookings count
   */
  async getTotalBookings(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const count = await this.analyticsRepository.getTotalBookings(start, end);

    return {
      totalBookings: count,
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Get room utilization data
   */
  async getRoomUtilization(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const utilization = await this.analyticsRepository.getRoomUtilization(start, end);

    // Calculate overall utilization average
    const totalUtilization = utilization.reduce((sum, room) => sum + room.utilizationRate, 0);
    const averageUtilization = utilization.length > 0 
      ? parseFloat((totalUtilization / utilization.length).toFixed(2)) 
      : 0;

    return {
      averageUtilization,
      roomUtilization: utilization,
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Get peak booking hours
   */
  async getPeakHours(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const hourlyData = await this.analyticsRepository.getPeakHours(start, end);

    // Find peak hour
    const peakHourData = hourlyData.reduce((max, hour) => 
      hour.count > max.count ? hour : max, 
      hourlyData[0]
    );

    return {
      peakHour: peakHourData?.hour || 0,
      peakHourLabel: peakHourData?.label || '0:00',
      peakHourBookings: peakHourData?.count || 0,
      hourlyBreakdown: hourlyData,
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Get most booked rooms
   */
  async getMostBookedRooms(limit?: number, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const rooms = await this.analyticsRepository.getMostBookedRooms(limit || 10, start, end);

    return {
      mostBookedRooms: rooms,
      period: {
        startDate,
        endDate,
      },
    };
  }
}
