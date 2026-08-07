import { apiClient } from '../../lib/axios';
import { Booking } from '../../types';
import { CreateBookingInput, UpdateBookingInput, GetBookingsQuery, PaginatedBookingsResponse } from './types';

export const getBookings = async (query?: GetBookingsQuery): Promise<PaginatedBookingsResponse> => {
  const response = await apiClient.get('/bookings', { params: query });
  return response.data.data;
};

export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await apiClient.get(`/bookings/${id}`);
  return response.data.data;
};

export const createBooking = async (data: CreateBookingInput): Promise<Booking> => {
  const response = await apiClient.post('/bookings', data);
  return response.data.data;
};

export const updateBooking = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateBookingInput;
}): Promise<Booking> => {
  const response = await apiClient.put(`/bookings/${id}`, data);
  return response.data.data;
};

export const cancelBooking = async (id: string): Promise<Booking> => {
  const response = await apiClient.patch(`/bookings/${id}/cancel`);
  return response.data.data;
};

export const deleteBooking = async (id: string): Promise<void> => {
  await apiClient.delete(`/bookings/${id}`);
};
