import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClientMock, resetApiClientMock } from '../../mocks/apiClient';

vi.mock('../../../src/lib/axios', () => ({
  apiClient: apiClientMock,
}));

import {
  getDashboardAnalytics,
  getMostBookedRooms,
  getPeakHours,
  getRoomUtilization,
  getTotalBookings,
} from '../../../src/features/analytics/api';

const range = { startDate: '2030-01-01T00:00:00.000Z', endDate: '2030-01-31T23:59:59.000Z' };

describe('analytics API module', () => {
  beforeEach(() => {
    resetApiClientMock();
  });

  it('getDashboardAnalytics sends both range instants', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { totalBookings: 2 } } });
    const result = await getDashboardAnalytics(range);
    expect(result.totalBookings).toBe(2);
    expect(apiClientMock.get).toHaveBeenCalledWith('/analytics/dashboard', { params: range });
  });

  it('getTotalBookings sends the selected range', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { totalBookings: 4 } } });
    await getTotalBookings(range);
    expect(apiClientMock.get).toHaveBeenCalledWith('/analytics/total-bookings', { params: range });
  });

  it('getRoomUtilization sends the selected range', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { averageUtilization: 12.5 } } });
    await getRoomUtilization(range);
    expect(apiClientMock.get).toHaveBeenCalledWith('/analytics/room-utilization', { params: range });
  });

  it('getPeakHours sends the selected range', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { peakHour: null } } });
    await getPeakHours(range);
    expect(apiClientMock.get).toHaveBeenCalledWith('/analytics/peak-hours', { params: range });
  });

  it('getMostBookedRooms sends range and optional limit', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { mostBookedRooms: [] } } });
    await getMostBookedRooms({ ...range, limit: 5 });
    expect(apiClientMock.get).toHaveBeenCalledWith('/analytics/most-booked-rooms', {
      params: { ...range, limit: 5 },
    });
  });
});
