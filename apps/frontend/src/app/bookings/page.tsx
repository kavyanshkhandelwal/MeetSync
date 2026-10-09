'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/components/bookings/BookingModal';
import { EditBookingModal } from '@/components/bookings/EditBookingModal';
import { useBookingsInRange } from '@/features/bookings/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import { useSidebar } from '@/hooks/use-sidebar';
import { toOffsetIso } from '@/lib/datetime';
import type { Booking } from '@/types';

const statusColors: Record<string, string> = {
  PENDING: '#fbbf24',
  CONFIRMED: '#10b981',
  CANCELLED: '#ef4444',
  COMPLETED: '#6b7280',
};

export default function BookingsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState<any>(null);
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>({});
  const { data: bookingsData, isLoading: bookingsLoading } = useBookingsInRange(
    range.startDate,
    range.endDate,
  );
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

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

  useEffect(() => {
    if (bookingsData?.data) {
      const newEvents: EventInput[] = bookingsData.data.map((booking: any) => ({
        id: booking.bookingId,
        title: `${booking.room?.name || 'Room'} · ${booking.purpose} · ${booking.status}`,
        start: booking.startTime,
        end: booking.endTime,
        backgroundColor: statusColors[booking.status] || '#3b82f6',
        borderColor: statusColors[booking.status] || '#3b82f6',
        extendedProps: {
          booking,
          roomId: booking.roomId,
          userId: booking.userId,
          status: booking.status,
          purpose: booking.purpose,
        },
      }));
      setEvents(newEvents);
    }
  }, [bookingsData]);

  const handleDatesSet = (info: DatesSetArg) => {
    setRange({
      startDate: toOffsetIso(info.start),
      endDate: toOffsetIso(info.end),
    });
  };

  const canManageBooking = (booking: Booking) => {
    if (!user) return false;
    return user.role === 'ADMIN' || booking.userId === user.userId;
  };

  const handleEventClick = (info: EventClickArg) => {
    const booking = info.event.extendedProps.booking as Booking | undefined;
    if (!booking) return;
    if (!canManageBooking(booking)) {
      setActionError('You can only edit or cancel your own bookings.');
      return;
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      setActionError('This booking can no longer be changed.');
      return;
    }
    setActionError(null);
    setSelectedBooking(booking);
    setIsEditOpen(true);
  };

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold">Bookings</h1>
                <p className="text-sm text-muted-foreground">
                  View and manage conference room bookings
                </p>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Button>
            </div>

            {actionError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{actionError}</div>
            )}

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {bookingsLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="p-4">
                    <style jsx global>{`
                      .fc {
                        font-family: system-ui, -apple-system, sans-serif;
                      }
                      .fc .fc-button {
                        background: #3b82f6 !important;
                        border: 0 !important;
                      }
                      .fc .fc-button:hover {
                        background: #2563eb !important;
                      }
                      .fc .fc-button-primary:not(:disabled):active {
                        background: #1d4ed8 !important;
                      }
                      .fc .fc-daygrid-day-number {
                        font-size: 0.875rem;
                      }
                      .fc .fc-toolbar-title {
                        font-size: 1.25rem;
                        font-weight: 600;
                      }
                      @media (max-width: 768px) {
                        .fc .fc-toolbar {
                          flex-direction: column !important;
                          gap: 0.75rem !important;
                        }
                      }
                    `}</style>
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                      }}
                      views={{
                        dayGridMonth: { buttonText: 'Month' },
                        timeGridWeek: { buttonText: 'Week' },
                        timeGridDay: { buttonText: 'Day' },
                      }}
                      events={events}
                      editable={false}
                      selectable={true}
                      weekends={true}
                      height="auto"
                      datesSet={handleDatesSet}
                      eventClick={handleEventClick}
                      select={(info) => {
                        setSelectedDate(info.start);
                        setIsModalOpen(true);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <BookingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultDate={selectedDate}
      />
      <EditBookingModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        booking={selectedBooking}
        allowCancel
        onCancelled={() => {
          setSelectedBooking(null);
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}
