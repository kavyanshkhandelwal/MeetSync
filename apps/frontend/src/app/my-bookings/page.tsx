'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditBookingModal } from '@/components/bookings/EditBookingModal';
import { useBookings, useCancelBooking } from '@/features/bookings/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import type { Booking } from '@/types';
import { useSidebar } from '@/hooks/use-sidebar';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

export default function MyBookingsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  const [user, setUser] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const cancelBooking = useCancelBooking();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        router.push('/login');
      }
    } else if (!currentUser && !userLoading) {
      router.push('/login');
    }
  }, [currentUser, userLoading, router]);

  // Separate upcoming and past bookings
  const bookings = bookingsData?.data || [];
  const now = new Date();
  
  const upcomingBookings = bookings.filter(
    (booking: Booking) => new Date(booking.startTime) > now && booking.status !== 'CANCELLED'
  );
  
  const pastBookings = bookings.filter(
    (booking: Booking) => new Date(booking.endTime) < now || booking.status === 'CANCELLED'
  );

  const handleCancelBooking = (booking: Booking) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking.mutate(booking.bookingId);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (userLoading || !user) {
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
            {/* Upcoming Bookings */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Upcoming Bookings</h2>
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading bookings...
                </div>
              ) : upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You have no upcoming bookings</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingBookings.map((booking: Booking) => (
                    <Card key={booking.bookingId} className="transition-shadow hover:shadow-md">
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{booking.room?.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {formatDate(booking.startTime)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </CardDescription>
                        </div>
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <p className="flex-1 text-sm text-muted-foreground">
                            {booking.purpose}
                          </p>
                          {booking.status !== 'CANCELLED' && (
                            <div className="flex gap-2 ml-auto">
                              <Button
                                variant="ghost" size="sm" onClick={() => handleEditBooking(booking)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost" size="sm" onClick={() => handleCancelBooking(booking)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Past Bookings */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Past Bookings</h2>
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading bookings...
                </div>
              ) : pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You have no past bookings</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastBookings.map((booking: Booking) => (
                    <Card key={booking.bookingId} className="transition-shadow hover:shadow-md">
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{booking.room?.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {formatDate(booking.startTime)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </CardDescription>
                        </div>
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {booking.purpose}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <EditBookingModal
              open={editModalOpen}
              onOpenChange={setEditModalOpen}
              booking={bookingToEdit}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
