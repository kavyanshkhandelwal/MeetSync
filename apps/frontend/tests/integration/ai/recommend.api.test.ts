import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClientMock, resetApiClientMock } from '../../mocks/apiClient';

vi.mock('../../../src/lib/axios', () => ({
  apiClient: apiClientMock,
}));

import { recommendRooms } from '../../../src/features/ai/api';
import { createBooking } from '../../../src/features/bookings/api';

describe('recommendation API module', () => {
  beforeEach(() => {
    resetApiClientMock();
  });

  it('submits the query to POST /ai/recommend', async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: { data: { extracted: { capacity: 8 }, rooms: [], extractionSource: 'fallback' } },
    });
    const result = await recommendRooms('8 people tomorrow at 3 PM');
    expect(apiClientMock.post).toHaveBeenCalledWith('/ai/recommend', {
      query: '8 people tomorrow at 3 PM',
    });
    expect(result.extractionSource).toBe('fallback');
  });

  it('submits edited constraints with the query on a later Find rooms request', async () => {
    apiClientMock.post.mockResolvedValueOnce({
      data: { data: { extracted: { capacity: 12 }, rooms: [], extractionSource: 'fallback' } },
    });
    await recommendRooms('8 people tomorrow at 3 PM', {
      capacity: 12,
      startTime: '2030-06-16T15:00:00+00:00',
      endTime: '2030-06-16T16:00:00+00:00',
      equipment: [],
      purpose: 'Planning workshop',
    });
    expect(apiClientMock.post).toHaveBeenCalledWith('/ai/recommend', {
      query: '8 people tomorrow at 3 PM',
      constraints: {
        capacity: 12,
        startTime: '2030-06-16T15:00:00+00:00',
        endTime: '2030-06-16T16:00:00+00:00',
        equipment: [],
        purpose: 'Planning workshop',
      },
    });
  });

  it('Book Now uses the existing bookings API, not an AI book endpoint', async () => {
    apiClientMock.post.mockResolvedValueOnce({ data: { data: { bookingId: 'b1' } } });
    await createBooking({
      roomId: 'r1',
      startTime: '2030-06-16T15:00:00+00:00',
      endTime: '2030-06-16T16:00:00+00:00',
      purpose: 'Team meeting',
    });
    expect(apiClientMock.post).toHaveBeenCalledWith('/bookings', {
      roomId: 'r1',
      startTime: '2030-06-16T15:00:00+00:00',
      endTime: '2030-06-16T16:00:00+00:00',
      purpose: 'Team meeting',
    });
    expect(apiClientMock.post.mock.calls[0][0]).not.toBe('/ai/book');
  });
});
