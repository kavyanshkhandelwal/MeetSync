import { useQuery } from '@tanstack/react-query';
import {
  getDashboardAnalytics,
  getTotalBookings,
  getRoomUtilization,
  getPeakHours,
  getMostBookedRooms,
} from './api';
import { AnalyticsRangeParams } from './types';

type AnalyticsQueryOptions = {
  enabled?: boolean;
};

function rangeEnabled(params?: Partial<AnalyticsRangeParams>, enabled = true): boolean {
  return Boolean(enabled && params?.startDate && params?.endDate);
}

export function useDashboardAnalytics(
  params?: Partial<AnalyticsRangeParams>,
  options?: AnalyticsQueryOptions,
) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: () => getDashboardAnalytics(params as AnalyticsRangeParams),
    enabled: rangeEnabled(params, options?.enabled),
  });
}

export function useTotalBookings(
  params?: Partial<AnalyticsRangeParams>,
  options?: AnalyticsQueryOptions,
) {
  return useQuery({
    queryKey: ['analytics', 'totalBookings', params],
    queryFn: () => getTotalBookings(params as AnalyticsRangeParams),
    enabled: rangeEnabled(params, options?.enabled),
  });
}

export function useRoomUtilization(
  params?: Partial<AnalyticsRangeParams>,
  options?: AnalyticsQueryOptions,
) {
  return useQuery({
    queryKey: ['analytics', 'roomUtilization', params],
    queryFn: () => getRoomUtilization(params as AnalyticsRangeParams),
    enabled: rangeEnabled(params, options?.enabled),
  });
}

export function usePeakHours(
  params?: Partial<AnalyticsRangeParams>,
  options?: AnalyticsQueryOptions,
) {
  return useQuery({
    queryKey: ['analytics', 'peakHours', params],
    queryFn: () => getPeakHours(params as AnalyticsRangeParams),
    enabled: rangeEnabled(params, options?.enabled),
  });
}

export function useMostBookedRooms(
  params?: Partial<AnalyticsRangeParams> & { limit?: number },
  options?: AnalyticsQueryOptions,
) {
  return useQuery({
    queryKey: ['analytics', 'mostBookedRooms', params],
    queryFn: () => getMostBookedRooms(params as AnalyticsRangeParams & { limit?: number }),
    enabled: rangeEnabled(params, options?.enabled),
  });
}
