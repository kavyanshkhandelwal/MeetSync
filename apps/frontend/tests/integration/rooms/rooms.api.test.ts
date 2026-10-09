import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClientMock, resetApiClientMock } from '../../mocks/apiClient';

vi.mock('../../../src/lib/axios', () => ({
  apiClient: apiClientMock,
}));

import {
  createRoom,
  deleteRoom,
  getRoomAvailability,
  getRoomById,
  getRooms,
  updateRoom,
} from '../../../src/features/rooms/api';

describe('rooms API module', () => {
  beforeEach(() => {
    resetApiClientMock();
  });

  it('getRooms requests /rooms', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { data: [], meta: {} } } });
    await getRooms({ page: 1 });
    expect(apiClientMock.get).toHaveBeenCalledWith('/rooms', { params: { page: 1 } });
  });

  it('getRooms forwards server-side filter params', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { data: [], meta: {} } } });
    const query = {
      building: 'HQ',
      floor: 2,
      minCapacity: 6,
      equipment: 'projector',
      status: 'ACTIVE',
    };
    await getRooms(query);
    expect(apiClientMock.get).toHaveBeenCalledWith('/rooms', { params: query });
  });

  it('getRoomById requests /rooms/:id', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: { roomId: 'r1' } } });
    await getRoomById('r1');
    expect(apiClientMock.get).toHaveBeenCalledWith('/rooms/r1');
  });

  it('createRoom posts /rooms', async () => {
    const payload = {
      name: 'Orion',
      capacity: 8,
      floor: 2,
      building: 'HQ',
      equipments: ['projector'],
      status: 'ACTIVE' as const,
    };
    apiClientMock.post.mockResolvedValueOnce({ data: { data: { roomId: 'r1', ...payload } } });
    await createRoom(payload);
    expect(apiClientMock.post).toHaveBeenCalledWith('/rooms', payload);
  });

  it('updateRoom puts /rooms/:id', async () => {
    apiClientMock.put.mockResolvedValueOnce({ data: { data: { roomId: 'r1', status: 'INACTIVE' } } });
    await updateRoom({ id: 'r1', data: { status: 'INACTIVE' } });
    expect(apiClientMock.put).toHaveBeenCalledWith('/rooms/r1', { status: 'INACTIVE' });
  });

  it('deleteRoom deletes /rooms/:id', async () => {
    apiClientMock.delete.mockResolvedValueOnce({ data: { data: null } });
    await deleteRoom('r1');
    expect(apiClientMock.delete).toHaveBeenCalledWith('/rooms/r1');
  });

  it('getRoomAvailability requests the date range', async () => {
    apiClientMock.get.mockResolvedValueOnce({
      data: { data: { roomId: 'r1', bookable: true, bookings: [] } },
    });
    const query = {
      startDate: '2030-01-01T00:00:00+00:00',
      endDate: '2030-01-02T00:00:00+00:00',
    };
    await getRoomAvailability('r1', query);
    expect(apiClientMock.get).toHaveBeenCalledWith('/rooms/r1/availability', { params: query });
  });

  it('getRoomAvailability surfaces an API failure', async () => {
    apiClientMock.get.mockRejectedValueOnce(new Error('network'));
    await expect(
      getRoomAvailability('r1', {
        startDate: '2030-01-01T00:00:00+00:00',
        endDate: '2030-01-02T00:00:00+00:00',
      }),
    ).rejects.toThrow('network');
  });
});
