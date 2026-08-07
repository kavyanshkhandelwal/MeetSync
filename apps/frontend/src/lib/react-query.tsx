'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode, useEffect } from 'react';
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
    socket.on('ROOM_BOOKED', () => {
      console.log('Received ROOM_BOOKED event - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    // Listen for ROOM_CANCELLED events
    socket.on('ROOM_CANCELLED', () => {
      console.log('Received ROOM_CANCELLED event - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    // Listen for BOOKING_UPDATED events
    socket.on('BOOKING_UPDATED', () => {
      console.log('Received BOOKING_UPDATED event - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    // Listen for ROOM_UPDATED events
    socket.on('ROOM_UPDATED', () => {
      console.log('Received ROOM_UPDATED event - invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    });

    return () => {
      // Cleanup listeners on unmount
      socket.off('ROOM_BOOKED');
      socket.off('ROOM_CANCELLED');
      socket.off('BOOKING_UPDATED');
      socket.off('ROOM_UPDATED');
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
