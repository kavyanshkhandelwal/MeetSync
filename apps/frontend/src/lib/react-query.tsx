'use client';

import React, { useState, ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { initSocket } from './socket';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const socket = initSocket();

    // Listen for ROOM_BOOKED events
    const invalidateBookings = () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    };

    const invalidateRooms = () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room'] });
    };

    const invalidateDeletedRoom = () => {
      invalidateRooms();
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    };

    socket.on('ROOM_BOOKED', invalidateBookings);
    socket.on('ROOM_CANCELLED', invalidateBookings);
    socket.on('BOOKING_UPDATED', invalidateBookings);
    socket.on('ROOM_UPDATED', invalidateRooms);
    socket.on('ROOM_DELETED', invalidateDeletedRoom);

    return () => {
      socket.off('ROOM_BOOKED', invalidateBookings);
      socket.off('ROOM_CANCELLED', invalidateBookings);
      socket.off('BOOKING_UPDATED', invalidateBookings);
      socket.off('ROOM_UPDATED', invalidateRooms);
      socket.off('ROOM_DELETED', invalidateDeletedRoom);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
