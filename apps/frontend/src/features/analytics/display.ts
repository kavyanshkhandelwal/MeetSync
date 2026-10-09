export function analyticsErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || 'Analytics could not be loaded';
}

export function formatUtilizationPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function occupancyCard(input: {
  loading: boolean;
  error: boolean;
  averageUtilization?: number;
  totalActiveRooms?: number;
  periodLabel: string;
}): { value: string; description: string } {
  if (input.loading) {
    return { value: '—', description: 'Loading utilization' };
  }
  if (input.error) {
    return { value: '—', description: 'Utilization unavailable' };
  }
  if (!input.totalActiveRooms) {
    return { value: '—', description: 'No available rooms' };
  }
  return {
    value: formatUtilizationPercent(input.averageUtilization ?? 0),
    description: input.periodLabel,
  };
}

export function peakHourDisplay(peakHourLabel: string | null | undefined, peakHourBookings: number | undefined): {
  value: string;
  description: string;
} {
  if (peakHourLabel == null) {
    return { value: '—', description: 'Insufficient booking data' };
  }
  return {
    value: peakHourLabel,
    description: `${peakHourBookings ?? 0} bookings`,
  };
}

export function mapPeakHoursChartData(
  hourlyBreakdown: Array<{ hour: number; count: number; label?: string }>,
) {
  return hourlyBreakdown.map((item) => ({
    hour: item.label ?? `${String(item.hour).padStart(2, '0')}:00 UTC`,
    bookings: item.count,
  }));
}

export function mapRoomUtilizationChartData(
  roomUtilization: Array<{ roomName: string; utilizationRate: number; totalBookings: number }>,
) {
  return roomUtilization.map((room) => ({
    name: room.roomName,
    utilization: room.utilizationRate,
    bookings: room.totalBookings,
  }));
}

export function hasChartSeries(rows: Array<{ count?: number; utilizationRate?: number }>): boolean {
  return rows.length > 0;
}
