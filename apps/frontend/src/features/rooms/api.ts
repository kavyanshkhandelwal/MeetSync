import { apiClient } from '../../lib/axios';
import { Room } from '../../types';
import {
  CreateRoomInput,
  UpdateRoomInput,
  GetRoomsQuery,
  PaginatedRoomsResponse,
  RoomAvailability,
  RoomAvailabilityQuery,
} from './types';

export const getRooms = async (query?: GetRoomsQuery): Promise<PaginatedRoomsResponse> => {
  const response = await apiClient.get('/rooms', { params: query });
  return response.data.data;
};

export const getRoomById = async (id: string): Promise<Room> => {
  const response = await apiClient.get(`/rooms/${id}`);
  return response.data.data;
};

export const createRoom = async (data: CreateRoomInput): Promise<Room> => {
  const response = await apiClient.post('/rooms', data);
  return response.data.data;
};

export const updateRoom = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateRoomInput;
}): Promise<Room> => {
  const response = await apiClient.put(`/rooms/${id}`, data);
  return response.data.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
  await apiClient.delete(`/rooms/${id}`);
};

export const getRoomAvailability = async (
  id: string,
  query: RoomAvailabilityQuery,
): Promise<RoomAvailability> => {
  const response = await apiClient.get(`/rooms/${id}/availability`, { params: query });
  return response.data.data;
};
