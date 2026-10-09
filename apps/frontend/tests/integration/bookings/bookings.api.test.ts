import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClientMock, resetApiClientMock } from '../../mocks/apiClient';

vi.mock('../../../src/lib/axios', () => ({
  apiClient: apiClientMock,
}));

import { cancelBooking, createBooking, getBookings, getBookingsInRange, updateBooking } from '../../../src/features/bookings/api';

describe('bookings API module', () => {
  beforeEach(() => {
    resetApiClientMock();
  });

  it('createBooking posts /bookings', async () => {
    const payload = {
      roomId: '22222222-2222-2222-2222-222222222222',
      startTime: '2030-01-01T10:00:00.000+00:00',
      endTime: '2030-01-01T11:00:00.000+00:00',
      purpose: 'Planning',
    };
    apiClientMock.post.mockResolvedValueOnce({ data: { data: { bookingId: 'b1' } } });
    await createBooking(payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/bookings', payload);
  });

  it('cancelBooking patches /bookings/:id/cancel', async () => {
    apiClientMock.patch.mockResolvedValueOnce({ data: { data: { status: 'CANCELLED' } } });
    await cancelBooking('b1');
    expect(apiClientMock.patch).toHaveBeenCalledWith('/bookings/b1/cancel');
  });

  it('updateBooking puts /bookings/:id', async () => {
    apiClientMock.put.mockResolvedValueOnce({ data: { data: { bookingId: 'b1' } } });
    await updateBooking({ id: 'b1', data: { purpose: 'Updated purpose' } });
    expect(apiClientMock.put).toHaveBeenCalledWith('/bookings/b1', { purpose: 'Updated purpose' });
  });

  it('getBookings passes a date range instead of relying on the default page of 10', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { data: [], meta: { totalPages: 1 } } } });
    await getBookings({
      startDate: '2030-09-01T00:00:00+00:00',
      endDate: '2030-09-08T00:00:00+00:00',
      limit: 100,
      page: 1,
    });
    expect(apiClientMock.get).toHaveBeenCalledWith('/bookings', {
      params: {
        startDate: '2030-09-01T00:00:00+00:00',
        endDate: '2030-09-08T00:00:00+00:00',
        limit: 100,
        page: 1,
      },
    });
  });

  it('getBookingsInRange fetches every page when more than 10 bookings exist', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ bookingId: `b${i}` }));
    const page2 = Array.from({ length: 15 }, (_, i) => ({ bookingId: `c${i}` }));
    apiClientMock.get
      .mockResolvedValueOnce({
        data: { data: { data: page1, meta: { totalPages: 2, page: 1, limit: 100, total: 115 } } },
      })
      .mockResolvedValueOnce({
        data: { data: { data: page2, meta: { totalPages: 2, page: 2, limit: 100, total: 115 } } },
      });

    const result = await getBookingsInRange(
      '2030-09-01T00:00:00+00:00',
      '2030-09-08T00:00:00+00:00',
    );
    expect(result.data).toHaveLength(115);
    expect(apiClientMock.get).toHaveBeenCalledTimes(2);
  });
});
