import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoom, deleteRoom, getRoomAvailability, getRoomById, getRooms, updateRoom } from './api';
import { CreateRoomInput, UpdateRoomInput, GetRoomsQuery, RoomAvailabilityQuery } from './types';

export const useRooms = (query?: GetRoomsQuery) => {
  return useQuery({
    queryKey: ['rooms', query],
    queryFn: () => getRooms(query),
  });
};

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: ['room', id],
    queryFn: () => getRoomById(id),
    enabled: !!id,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRoom,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['room-availability'] });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useRoomAvailability = (id: string, query?: RoomAvailabilityQuery) => {
  return useQuery({
    queryKey: ['room-availability', id, query],
    queryFn: () => getRoomAvailability(id, query as RoomAvailabilityQuery),
    enabled: !!id && !!query?.startDate && !!query?.endDate,
  });
};
