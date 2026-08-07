import { apiClient } from '../../lib/axios';
import {
  DashboardAnalytics,
  TotalBookingsResponse,
  RoomUtilizationResponse,
  PeakHoursResponse,
  MostBookedRoomsResponse,
} from './types';

export const getDashboardAnalytics = async (
  params?: { startDate?: string; endDate?: string }
): Promise<DashboardAnalytics> => {
  const response = await apiClient.get('/analytics/dashboard', { params });
  return response.data.data;
};

export const getTotalBookings = async (
  params?: { startDate?: string; endDate?: string }
): Promise<TotalBookingsResponse> => {
  const response = await apiClient.get('/analytics/total-bookings', { params });
  return response.data.data;
};

export const getRoomUtilization = async (
  params?: { startDate?: string; endDate?: string }
): Promise<RoomUtilizationResponse> => {
  const response = await apiClient.get('/analytics/room-utilization', { params });
  return response.data.data;
};

export const getPeakHours = async (
  params?: { startDate?: string; endDate?: string }
): Promise<PeakHoursResponse> => {
  const response = await apiClient.get('/analytics/peak-hours', { params });
  return response.data.data;
};

export const getMostBookedRooms = async (
  params?: { limit?: number; startDate?: string; endDate?: string }
): Promise<MostBookedRoomsResponse> => {
  const response = await apiClient.get('/analytics/most-booked-rooms', { params });
  return response.data.data;
};
