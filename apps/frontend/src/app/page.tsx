'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CalendarDays,
  DoorOpen,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { useCurrentUser } from '@/features/auth/hooks';
import { useRooms } from '@/features/rooms/hooks';
import { useBookings } from '@/features/bookings/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/hooks/use-sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const { data: currentUser, isLoading, error } = useCurrentUser();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        router.push('/login');
      }
    } else if (!currentUser && !isLoading) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const totalRooms = rooms?.meta.total || 0;
  const totalBookings = bookings?.meta.total || 0;

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
            {user.role === 'ADMIN' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="Total Rooms"
                  value={totalRooms}
                  icon={<DoorOpen className="h-4 w-4" />}
                />
                <StatCard
                  title="Total Bookings"
                  value={totalBookings}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <StatCard
                  title="Occupancy Rate"
                  value="68%"
                  description="+12% from last month"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <StatCard
                  title="My Bookings"
                  value={totalBookings}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <StatCard
                  title="Upcoming"
                  value={bookings?.data?.filter((b: any) => new Date(b.startTime) > new Date()).length || 0}
                  icon={<CalendarDays className="h-4 w-4" />}
                />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {user.role === 'ADMIN' ? 'All Bookings' : 'My Upcoming Bookings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(bookings?.data || []).slice(0, 5).map((booking: any) => (
                        <div
                          key={booking.bookingId}
                          className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {booking.room?.name || 'Room'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.startTime).toLocaleDateString()} ·{' '}
                              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Rooms</CardTitle>
                </CardHeader>
                <CardContent>
                  {roomsLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(rooms?.data || []).slice(0, 5).map((room: any) => (
                        <div
                          key={room.roomId}
                          className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{room.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {room.building} · {room.floor}F · {room.capacity} seats
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${room.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                room.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}
                          >
                            {room.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
