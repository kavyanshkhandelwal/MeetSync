import { describe, expect, it } from 'vitest';
import {
  analyticsErrorMessage,
  formatUtilizationPercent,
  mapPeakHoursChartData,
  mapRoomUtilizationChartData,
  occupancyCard,
  peakHourDisplay,
} from '../../../src/features/analytics/display';

describe('analytics display mapping', () => {
  it('formats API utilization without inventing a value', () => {
    expect(formatUtilizationPercent(12.5)).toBe('12.5%');
    expect(formatUtilizationPercent(0)).toBe('0.0%');
  });

  it('shows em dash instead of 0% when there are no available rooms', () => {
    expect(
      occupancyCard({
        loading: false,
        error: false,
        averageUtilization: 0,
        totalActiveRooms: 0,
        periodLabel: 'This month',
      }),
    ).toEqual({ value: '—', description: 'No available rooms' });
  });

  it('shows a user-facing error instead of a stale occupancy number', () => {
    expect(
      occupancyCard({
        loading: false,
        error: true,
        averageUtilization: 68,
        totalActiveRooms: 3,
        periodLabel: 'This month',
      }),
    ).toEqual({ value: '—', description: 'Utilization unavailable' });
  });

  it('displays the API utilization when rooms exist', () => {
    expect(
      occupancyCard({
        loading: false,
        error: false,
        averageUtilization: 12.5,
        totalActiveRooms: 2,
        periodLabel: 'This month',
      }),
    ).toEqual({ value: '12.5%', description: 'This month' });
  });

  it('does not claim a peak hour without data', () => {
    expect(peakHourDisplay(null, 0)).toEqual({
      value: '—',
      description: 'Insufficient booking data',
    });
  });

  it('maps chart series from API fields only', () => {
    expect(
      mapPeakHoursChartData([{ hour: 9, count: 4, label: '09:00 UTC' }]),
    ).toEqual([{ hour: '09:00 UTC', bookings: 4 }]);
    expect(
      mapRoomUtilizationChartData([{ roomName: 'Orion', utilizationRate: 12.5, totalBookings: 2 }]),
    ).toEqual([{ name: 'Orion', utilization: 12.5, bookings: 2 }]);
  });

  it('surfaces the API error message', () => {
    expect(
      analyticsErrorMessage({ response: { data: { message: 'startDate and endDate are required' } } }),
    ).toBe('startDate and endDate are required');
  });
});
