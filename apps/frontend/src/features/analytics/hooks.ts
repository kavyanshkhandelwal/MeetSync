import { useQuery } from '@tanstack/react-query';
import {
  getDashboardAnalytics,
  getTotalBookings,
  getRoomUtilization,
  getPeakHours,
  getMostBookedRooms,
} from './api';

export function useDashboardAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: () => getDashboardAnalytics(params),
  });
}

export function useTotalBookings(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'totalBookings', params],
    queryFn: () => getTotalBookings(params),
  });
}

export function useRoomUtilization(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'roomUtilization', params],
    queryFn: () => getRoomUtilization(params),
  });
}

export function usePeakHours(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'peakHours', params],
    queryFn: () => getPeakHours(params),
  });
}

export function useMostBookedRooms(params?: { limit?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['analytics', 'mostBookedRooms', params],
    queryFn: () => getMostBookedRooms(params),
  });
}
