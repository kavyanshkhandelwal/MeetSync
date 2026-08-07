'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, DoorOpen, TrendingUp, Clock } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { BookingsByDayChart } from '@/components/analytics/BookingsByDayChart';
import { RoomUtilizationChart } from '@/components/analytics/RoomUtilizationChart';
import { PeakHoursChart } from '@/components/analytics/PeakHoursChart';
import { useCurrentUser } from '@/features/auth/hooks';
import { useBookings } from '@/features/bookings/hooks';
import {
  useDashboardAnalytics,
  useRoomUtilization,
  usePeakHours,
} from '@/features/analytics/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/hooks/use-sidebar';

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: bookings, isLoading: bookingsLoading } = useBookings({ limit: 100 });
  const { data: dashboard, isLoading: dashboardLoading } = useDashboardAnalytics();
  const { data: roomUtilization, isLoading: utilizationLoading } = useRoomUtilization();
  const { data: peakHours, isLoading: peakHoursLoading } = usePeakHours();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role !== 'ADMIN') {
          router.push('/');
        }
      } catch (e) {
        router.push('/login');
      }
    } else if (!currentUser && !isLoading) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        userRole={user.role} 
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        className="hidden flex-col md:flex" 
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Bookings"
                value={dashboard?.totalBookings || 0}
                icon={<Calendar className="h-4 w-4" />}
              />
              <StatCard
                title="Total Rooms"
                value={dashboard?.totalRooms || 0}
                icon={<DoorOpen className="h-4 w-4" />}
              />
              <StatCard
                title="Peak Hour"
                value={dashboard?.peakHourLabel || '0:00'}
                description={`${dashboard?.peakHourBookings || 0} bookings`}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatCard
                title="Avg Utilization"
                value={`${roomUtilization?.averageUtilization.toFixed(1) || 0}%`}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bookings by Day Chart */}
              {!bookingsLoading && bookings?.data && (
                <BookingsByDayChart bookings={bookings.data} />
              )}

              {/* Room Utilization Chart */}
              {!utilizationLoading && roomUtilization?.roomUtilization && (
                <RoomUtilizationChart roomUtilization={roomUtilization.roomUtilization} />
              )}

              {/* Peak Hours Chart */}
              {!peakHoursLoading && peakHours?.hourlyBreakdown && (
                <div className="col-span-1 lg:col-span-2">
                  <PeakHoursChart hourlyBreakdown={peakHours.hourlyBreakdown} />
                </div>
              )}
            </div>

            {/* Most Booked Rooms List */}
            {dashboard?.mostBookedRooms && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Booked Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.mostBookedRooms.map((room, index) => (
                      <div
                        key={room.roomId}
                        className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{room.roomName}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">
                          {room.totalBookings} bookings
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
