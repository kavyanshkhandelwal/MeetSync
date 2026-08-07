export type CreateBookingInput = {
  roomId: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export type UpdateBookingInput = Partial<CreateBookingInput> & {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
};

export type GetBookingsQuery = {
  page?: number;
  limit?: number;
  roomId?: string;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

export type PaginatedBookingsResponse = {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
