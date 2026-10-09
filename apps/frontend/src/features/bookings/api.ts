import { apiClient } from '../../lib/axios';
import { Booking } from '../../types';
import { CreateBookingInput, UpdateBookingInput, GetBookingsQuery, PaginatedBookingsResponse } from './types';

export const getBookings = async (query?: GetBookingsQuery): Promise<PaginatedBookingsResponse> => {
  const response = await apiClient.get('/bookings', { params: query });
  return response.data.data;
};

/** Fetches every page inside the visible calendar range (max 100 per page). */
export const getBookingsInRange = async (
  startDate: string,
  endDate: string,
): Promise<PaginatedBookingsResponse> => {
  const limit = 100;
  const first = await getBookings({ startDate, endDate, page: 1, limit });
  const pages = first.meta.totalPages || 1;
  if (pages <= 1) {
    return first;
  }

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      getBookings({ startDate, endDate, page: i + 2, limit }),
    ),
  );

  return {
    data: first.data.concat(...rest.map((page) => page.data)),
    meta: {
      ...first.meta,
      page: 1,
      limit: first.data.length + rest.reduce((sum, page) => sum + page.data.length, 0),
    },
  };
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
