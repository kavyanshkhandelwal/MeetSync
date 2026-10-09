'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoomForm } from '@/components/rooms/room-form';
import { useRoom, useUpdateRoom } from '@/features/rooms/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { useSidebar } from '@/hooks/use-sidebar';
import type { CreateRoomInput } from '@/features/rooms/types';

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const updateRoom = useUpdateRoom();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.role !== 'ADMIN') {
          router.replace(`/rooms/${roomId}`);
        }
      } catch {
        router.push('/login');
      }
    } else if (!currentUser && !userLoading) {
      router.push('/login');
    } else if (currentUser && currentUser.role !== 'ADMIN') {
      router.replace(`/rooms/${roomId}`);
    }
  }, [currentUser, userLoading, router, roomId]);

  if (userLoading || roomLoading || !user || !room || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data: CreateRoomInput) => {
    await updateRoom.mutateAsync({ id: roomId, data });
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
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Edit room</h1>
                <p className="text-sm text-muted-foreground">{room.name}</p>
              </div>
              <Button variant="ghost" onClick={() => router.push(`/rooms/${roomId}`)}>
                Back
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Room details</CardTitle>
              </CardHeader>
              <CardContent>
                <RoomForm
                  submitLabel={updateRoom.isPending ? 'Saving...' : 'Save changes'}
                  defaultValues={{
                    name: room.name,
                    capacity: room.capacity,
                    floor: room.floor,
                    building: room.building,
                    description: room.description || '',
                    equipmentsText: (room.equipments || []).join(', '),
                    status: room.status,
                  }}
                  onSubmit={onSubmit}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
