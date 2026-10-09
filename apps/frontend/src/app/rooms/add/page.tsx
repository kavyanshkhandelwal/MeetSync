'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoomForm } from '@/components/rooms/room-form';
import { useCreateRoom } from '@/features/rooms/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { useSidebar } from '@/hooks/use-sidebar';
import type { CreateRoomInput } from '@/features/rooms/types';

export default function AddRoomPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const createRoom = useCreateRoom();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.role !== 'ADMIN') {
          router.replace('/rooms');
        }
      } catch {
        router.push('/login');
      }
    } else if (!currentUser && !userLoading) {
      router.push('/login');
    } else if (currentUser && currentUser.role !== 'ADMIN') {
      router.replace('/rooms');
    }
  }, [currentUser, userLoading, router]);

  if (userLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const onSubmit = async (data: CreateRoomInput) => {
    await createRoom.mutateAsync(data);
    router.push('/rooms');
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
                <h1 className="text-2xl font-bold">Create room</h1>
                <p className="text-sm text-muted-foreground">Add a conference room</p>
              </div>
              <Button variant="ghost" onClick={() => router.push('/rooms')}>
                Back
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Room details</CardTitle>
              </CardHeader>
              <CardContent>
                <RoomForm submitLabel="Create room" onSubmit={onSubmit} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
