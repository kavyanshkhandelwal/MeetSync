'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building,
  Plus,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/components/bookings/BookingModal';
import { AvailabilityPanel } from '@/components/rooms/availability-panel';
import { useRoom } from '@/features/rooms/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { useSidebar } from '@/hooks/use-sidebar';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [user, setUser] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

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

  if (userLoading || roomLoading || !user || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar
          userRole={user.role}
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          className="hidden flex-col md:flex"
        />
        <div className="flex flex-1 flex-col">
          <Header user={user} />
          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Rooms
              </Button>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Room Info */}
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl">{room.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {room.building} · {room.floor}F
                          </p>
                        </div>
                        <Badge className={statusColors[room.status]} variant="secondary">
                          {room.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {room.description && (
                        <p className="text-muted-foreground mb-6">
                          {room.description}
                        </p>
                      )}

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Capacity</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {room.capacity} seats
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Building</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {room.building}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Floor</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {room.floor}F
                          </p>
                        </div>
                      </div>

                      {room.equipments?.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-medium mb-2">Equipment</p>
                          <div className="flex flex-wrap gap-2">
                            {room.equipments.map((eq: string) => (
                              <Badge key={eq} variant="outline">
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Availability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AvailabilityPanel roomId={roomId} roomStatus={room.status} />
                    </CardContent>
                  </Card>
                </div>

                {/* Booking CTA */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Book This Room</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user.role === 'ADMIN' && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/rooms/${roomId}/edit`}>Edit room</Link>
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Reserve this conference room for your meeting
                      </p>

                      <Button
                        className="w-full"
                        disabled={room.status !== 'ACTIVE'}
                        onClick={() => setIsBookingOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Book Now
                      </Button>

                      {room.status !== 'ACTIVE' && (
                        <p className="text-sm text-muted-foreground">
                          This room is currently not available for booking
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
                        
      <BookingModal
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        defaultRoomId={roomId}
      />
    </div>
  );
}
