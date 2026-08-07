export interface Period {
  startDate?: string;
  endDate?: string;
}

export interface DashboardAnalytics {
  totalBookings: number;
  totalRooms: number;
  totalActiveRooms: number;
  peakHour: number;
  peakHourLabel: string;
  peakHourBookings: number;
  mostBookedRooms: MostBookedRoom[];
  hourlyBreakdown: HourlyData[];
}

export interface MostBookedRoom {
  roomId: string;
  roomName: string;
  totalBookings: number;
}

export interface HourlyData {
  hour: number;
  count: number;
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
  totalBookings: number;
  totalBookedHours: number;
  utilizationRate: number;
}

export interface PeakHoursResponse {
  peakHour: number;
  peakHourLabel: string;
  peakHourBookings: number;
  hourlyBreakdown: HourlyData[];
  period: Period;
}

export interface MostBookedRoomsResponse {
  mostBookedRooms: RoomBookings[];
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
