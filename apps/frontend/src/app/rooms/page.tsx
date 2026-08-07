'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DoorOpen,
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRooms } from '@/features/rooms/hooks';
import { useCurrentUser } from '@/features/auth/hooks';
import { useSidebar } from '@/hooks/use-sidebar';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
};

export default function RoomsPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<any>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data, isLoading } = useRooms({
    search: search || undefined,
    building: building || undefined,
    status: status || undefined,
    page,
    limit,
  });

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
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold">Rooms</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and view conference rooms
                </p>
              </div>
              {user.role === 'ADMIN' && (
                <Button asChild>
                  <Link href="/rooms/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Room
                  </Link>
                </Button>
              )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search rooms..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm md:w-48"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            {/* Room Cards */}
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 w-3/4 bg-gray-200 rounded" />
                      <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {data?.data?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-6">
                      <DoorOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No rooms found</h3>
                    <p className="text-sm text-muted-foreground">
                      {search || status
                        ? 'Try adjusting your search or filters'
                        : 'No rooms are available yet'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {data?.data?.map((room: any) => (
                      <Card
                        key={room.roomId}
                        className="overflow-hidden transition-shadow hover:shadow-md"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg">
                                <Link
                                  href={`/rooms/${room.roomId}`}
                                  className="transition-colors hover:text-primary"
                                >
                                  {room.name}
                                </Link>
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {room.building} · {room.floor}F
                              </p>
                            </div>
                            <Badge
                              className={statusColors[room.status]}
                              variant="secondary"
                            >
                              {room.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{room.capacity} seats</span>
                            </div>
                            {room.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {room.description}
                              </p>
                            )}
                            {room.equipments?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {room.equipments.map((eq: string) => (
                                  <Badge key={eq} variant="outline" className="text-xs">
                                    {eq}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {user.role === 'ADMIN' && (
                            <div className="mt-4 flex gap-2">
                              <Button variant="ghost" size="sm" className="flex-1">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {data?.meta && data.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((data.meta.page - 1) * data.meta.limit + 1)} to{' '}
                      {Math.min(data.meta.page * data.meta.limit, data.meta.total)}{' '}
                      of {data.meta.total} rooms
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.meta.page <= 1}
                        onClick={() => setPage(Math.max(1, data.meta.page - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.meta.page >= data.meta.totalPages}
                        onClick={() => setPage(data.meta.page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
