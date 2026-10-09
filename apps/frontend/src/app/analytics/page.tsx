'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, DoorOpen, TrendingUp, Clock } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { BookingsByDayChart } from '@/components/analytics/BookingsByDayChart';
import { RoomUtilizationChart } from '@/components/analytics/RoomUtilizationChart';
import { PeakHoursChart } from '@/components/analytics/PeakHoursChart';
import { useCurrentUser } from '@/features/auth/hooks';
import { useDashboardAnalytics } from '@/features/analytics/hooks';
import {
  analyticsRangeForPreset,
  rangeFromLocalInputs,
  type AnalyticsPreset,
} from '@/features/analytics/range';
import {
  analyticsErrorMessage,
  occupancyCard,
  peakHourDisplay,
} from '@/features/analytics/display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/hooks/use-sidebar';

const PRESETS: Array<{ id: Exclude<AnalyticsPreset, 'custom'>; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState<any>(null);
  const [preset, setPreset] = useState<AnalyticsPreset>('month');
  const [range, setRange] = useState(() => analyticsRangeForPreset('month'));
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError,
    error,
  } = useDashboardAnalytics(range);

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

  const occupancy = occupancyCard({
    loading: dashboardLoading,
    error: isError,
    averageUtilization: dashboard?.averageUtilization,
    totalActiveRooms: dashboard?.totalActiveRooms,
    periodLabel: 'Weighted booked ÷ available hours',
  });
  const peak = peakHourDisplay(dashboard?.peakHourLabel, dashboard?.peakHourBookings);
  const errorMessage = useMemo(() => (isError ? analyticsErrorMessage(error) : null), [isError, error]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const applyPreset = (next: Exclude<AnalyticsPreset, 'custom'>) => {
    setPreset(next);
    setRange(analyticsRangeForPreset(next));
  };

  const applyCustom = () => {
    const next = rangeFromLocalInputs(customStart, customEnd);
    if (!next) {
      return;
    }
    setPreset('custom');
    setRange(next);
  };

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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Date range is required. Hour buckets are reported in UTC.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant={preset === item.id ? 'default' : 'outline'}
                      onClick={() => applyPreset(item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant={preset === 'custom' ? 'default' : 'outline'}
                    onClick={() => setPreset('custom')}
                  >
                    Custom
                  </Button>
                </div>
                {preset === 'custom' && (
                  <div className="flex flex-wrap items-end gap-2">
                    <Input
                      type="datetime-local"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                      aria-label="Custom start"
                    />
                    <Input
                      type="datetime-local"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                      aria-label="Custom end"
                    />
                    <Button type="button" size="sm" onClick={applyCustom}>
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Bookings"
                value={dashboardLoading || isError ? '—' : dashboard?.totalBookings ?? 0}
                description="PENDING, CONFIRMED, and COMPLETED"
                icon={<Calendar className="h-4 w-4" />}
              />
              <StatCard
                title="Total Rooms"
                value={dashboardLoading || isError ? '—' : dashboard?.totalRooms ?? 0}
                icon={<DoorOpen className="h-4 w-4" />}
              />
              <StatCard
                title="Peak Hour"
                value={dashboardLoading || isError ? '—' : peak.value}
                description={dashboardLoading || isError ? undefined : peak.description}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatCard
                title="Utilization"
                value={occupancy.value}
                description={occupancy.description}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>

            {dashboardLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                Loading analytics...
              </div>
            ) : isError ? null : (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <BookingsByDayChart bookingsByDay={dashboard?.bookingsByDay ?? []} />
                  <RoomUtilizationChart roomUtilization={dashboard?.roomUtilization ?? []} />
                  <div className="col-span-1 lg:col-span-2">
                    <PeakHoursChart hourlyBreakdown={dashboard?.hourlyBreakdown ?? []} />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Most Booked Rooms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(dashboard?.mostBookedRooms ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bookings in this date range.</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard?.mostBookedRooms.map((room, index) => (
                          <div
                            key={room.roomId}
                            className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                              <p className="text-sm font-medium">{room.roomName}</p>
                            </div>
                            <span className="text-sm font-semibold">
                              {room.totalBookings} bookings
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
