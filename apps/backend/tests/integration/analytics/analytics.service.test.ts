import { afterEach, describe, expect, it } from 'vitest';
import { BadRequestError } from '../../../src/utils/errors';
import { AnalyticsService } from '../../../src/services/analytics.service';
import { AnalyticsRepository } from '../../../src/repositories/analytics.repository';

const RANGE = { startDate: '2030-01-01T00:00:00.000Z', endDate: '2030-01-02T00:00:00.000Z' };

describe('AnalyticsService', () => {
  const originalUtilization = AnalyticsRepository.prototype.getRoomUtilization;
  const originalPeak = AnalyticsRepository.prototype.getPeakHours;
  const originalTotal = AnalyticsRepository.prototype.getTotalBookings;
  const originalMost = AnalyticsRepository.prototype.getMostBookedRooms;
  const originalDashboard = AnalyticsRepository.prototype.getDashboardAnalytics;

  afterEach(() => {
    AnalyticsRepository.prototype.getRoomUtilization = originalUtilization;
    AnalyticsRepository.prototype.getPeakHours = originalPeak;
    AnalyticsRepository.prototype.getTotalBookings = originalTotal;
    AnalyticsRepository.prototype.getMostBookedRooms = originalMost;
    AnalyticsRepository.prototype.getDashboardAnalytics = originalDashboard;
  });

  it('rejects a missing date range instead of inventing one', () => {
    expect(() => new AnalyticsService().parseRange()).toThrow(BadRequestError);
    expect(() => new AnalyticsService().parseRange('2030-01-01T00:00:00.000Z')).toThrow(BadRequestError);
  });

  it('rejects an inverted or invalid range', () => {
    expect(() =>
      new AnalyticsService().parseRange('2030-01-02T00:00:00.000Z', '2030-01-01T00:00:00.000Z'),
    ).toThrow(BadRequestError);
    expect(() => new AnalyticsService().parseRange('not-a-date', '2030-01-02T00:00:00.000Z')).toThrow(
      BadRequestError,
    );
  });

  it('computes weighted utilization from booked and available hours', async () => {
    AnalyticsRepository.prototype.getRoomUtilization = async () =>
      [
        { totalBookedHours: 4, availableHours: 10, utilizationRate: 40 },
        { totalBookedHours: 0, availableHours: 100, utilizationRate: 0 },
      ] as any;

    const result = await new AnalyticsService().getRoomUtilization(RANGE.startDate, RANGE.endDate);
    expect(result.averageUtilization).toBe(3.64);
    expect(result.period).toEqual({ ...RANGE, timeZone: 'UTC' });
  });

  it('returns 0 utilization when there are no rooms', async () => {
    AnalyticsRepository.prototype.getRoomUtilization = async () => [] as any;
    const result = await new AnalyticsService().getRoomUtilization(RANGE.startDate, RANGE.endDate);
    expect(result.averageUtilization).toBe(0);
  });

  it('returns a null peak hour when every bucket is empty', async () => {
    AnalyticsRepository.prototype.getPeakHours = async () =>
      [
        { hour: 0, label: '00:00 UTC', count: 0 },
        { hour: 9, label: '09:00 UTC', count: 0 },
      ] as any;

    const result = await new AnalyticsService().getPeakHours(RANGE.startDate, RANGE.endDate);
    expect(result.peakHour).toBeNull();
    expect(result.peakHourLabel).toBeNull();
    expect(result.peakHourBookings).toBe(0);
  });

  it('selects the peak hour from hourly counts', async () => {
    AnalyticsRepository.prototype.getPeakHours = async () =>
      [
        { hour: 9, label: '09:00 UTC', count: 2 },
        { hour: 14, label: '14:00 UTC', count: 7 },
      ] as any;

    const result = await new AnalyticsService().getPeakHours(RANGE.startDate, RANGE.endDate);
    expect(result.peakHour).toBe(14);
    expect(result.peakHourBookings).toBe(7);
    expect(result.peakHourLabel).toBe('14:00 UTC');
  });

  it('wraps total bookings with the requested period', async () => {
    AnalyticsRepository.prototype.getTotalBookings = async () => 42;
    const result = await new AnalyticsService().getTotalBookings(RANGE.startDate, RANGE.endDate);
    expect(result.totalBookings).toBe(42);
    expect(result.period.startDate).toBe(RANGE.startDate);
  });

  it('defaults most-booked limit to 10 and ranks by booking count', async () => {
    let receivedLimit: number | undefined;
    AnalyticsRepository.prototype.getMostBookedRooms = async (limit: number) => {
      receivedLimit = limit;
      return [{ roomId: 'r1', totalBookings: 5 }] as any;
    };
    const result = await new AnalyticsService().getMostBookedRooms(
      undefined,
      RANGE.startDate,
      RANGE.endDate,
    );
    expect(receivedLimit).toBe(10);
    expect(result.ranking).toBe('booking_count');
    expect(result.mostBookedRooms).toHaveLength(1);
  });

  it('includes utilization and a nullable peak on the dashboard payload', async () => {
    AnalyticsRepository.prototype.getDashboardAnalytics = async () =>
      ({
        totalBookings: 0,
        totalRooms: 2,
        totalActiveRooms: 1,
        roomUtilization: [{ totalBookedHours: 0, availableHours: 24 }],
        hourlyBreakdown: [{ hour: 0, label: '00:00 UTC', count: 0 }],
        mostBookedRooms: [],
        bookingsByDay: [],
      }) as any;

    const result = await new AnalyticsService().getDashboardAnalytics(RANGE.startDate, RANGE.endDate);
    expect(result.averageUtilization).toBe(0);
    expect(result.peakHour).toBeNull();
    expect(result.period.timeZone).toBe('UTC');
  });
});
