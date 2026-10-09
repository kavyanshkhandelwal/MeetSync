import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBooking, createBooking, deleteBooking, getBookingById, getBookings, getBookingsInRange, updateBooking } from './api';
import { CreateBookingInput, UpdateBookingInput, GetBookingsQuery } from './types';

export const useBookings = (query?: GetBookingsQuery) => {
  return useQuery({
    queryKey: ['bookings', query],
    queryFn: () => getBookings(query),
  });
};

export const useBookingsInRange = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['bookings', 'range', startDate, endDate],
    queryFn: () => getBookingsInRange(startDate as string, endDate as string),
    enabled: !!startDate && !!endDate,
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBooking,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
