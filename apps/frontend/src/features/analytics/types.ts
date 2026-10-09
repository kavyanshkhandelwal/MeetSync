export interface Period {
  startDate: string;
  endDate: string;
  timeZone: string;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface DashboardAnalytics {
  totalBookings: number;
  totalRooms: number;
  totalActiveRooms: number;
  averageUtilization: number;
  peakHour: number | null;
  peakHourLabel: string | null;
  peakHourBookings: number;
  mostBookedRooms: MostBookedRoom[];
  hourlyBreakdown: HourlyData[];
  roomUtilization: RoomUtilization[];
  bookingsByDay: DailyCount[];
  period: Period;
}

export interface MostBookedRoom {
  roomId: string;
  roomName: string;
  totalBookings: number;
}

export interface HourlyData {
  hour: number;
  count: number;
  label?: string;
}

export interface TotalBookingsResponse {
  totalBookings: number;
  period: Period;
}

export interface RoomUtilizationResponse {
  averageUtilization: number;
  roomUtilization: RoomUtilization[];
  period: Period;
}

export interface RoomUtilization {
  roomId: string;
  roomName: string;
  capacity: number;
  building: string;
  floor: number;
  status?: string;
  totalBookings: number;
  totalBookedHours: number;
  availableHours?: number;
  utilizationRate: number;
}

export interface PeakHoursResponse {
  peakHour: number | null;
  peakHourLabel: string | null;
  peakHourBookings: number;
  hourlyBreakdown: HourlyData[];
  period: Period;
}

export interface MostBookedRoomsResponse {
  mostBookedRooms: RoomBookings[];
  ranking: 'booking_count';
  period: Period;
}

export interface RoomBookings {
  roomId: string;
  roomName: string;
  capacity: number;
  building: string;
  floor: number;
  totalBookings: number;
}

export type AnalyticsRangeParams = {
  startDate: string;
  endDate: string;
};
