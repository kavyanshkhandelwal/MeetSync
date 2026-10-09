import { apiClient } from '../../lib/axios';
import {
  AnalyticsRangeParams,
  DashboardAnalytics,
  TotalBookingsResponse,
  RoomUtilizationResponse,
  PeakHoursResponse,
  MostBookedRoomsResponse,
} from './types';

export const getDashboardAnalytics = async (
  params: AnalyticsRangeParams,
): Promise<DashboardAnalytics> => {
  const response = await apiClient.get('/analytics/dashboard', { params });
  return response.data.data;
};

export const getTotalBookings = async (
  params: AnalyticsRangeParams,
): Promise<TotalBookingsResponse> => {
  const response = await apiClient.get('/analytics/total-bookings', { params });
  return response.data.data;
};

export const getRoomUtilization = async (
  params: AnalyticsRangeParams,
): Promise<RoomUtilizationResponse> => {
  const response = await apiClient.get('/analytics/room-utilization', { params });
  return response.data.data;
};

export const getPeakHours = async (
  params: AnalyticsRangeParams,
): Promise<PeakHoursResponse> => {
  const response = await apiClient.get('/analytics/peak-hours', { params });
  return response.data.data;
};

export const getMostBookedRooms = async (
  params: AnalyticsRangeParams & { limit?: number },
): Promise<MostBookedRoomsResponse> => {
  const response = await apiClient.get('/analytics/most-booked-rooms', { params });
  return response.data.data;
};
