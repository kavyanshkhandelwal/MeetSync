import { z } from 'zod';
import { RoomStatus, Prisma } from '@prisma/client';

export const CreateRoomSchema = z.object({
  name: z.string().trim().min(2, 'Room name must be at least 2 characters').max(100, 'Room name must be at most 100 characters'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  floor: z.number().int(),
  building: z.string().trim().min(1, 'Building is required').max(100, 'Building name must be at most 100 characters'),
  description: z.string().trim().max(500, 'Description must be at most 500 characters').optional(),
  equipments: z.array(z.string()).default([]),
  status: z.nativeEnum(RoomStatus).default(RoomStatus.ACTIVE),
});

export const UpdateRoomSchema = CreateRoomSchema.partial();

export const RoomIdSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
});

const SortableFields = z.enum(['name', 'capacity', 'floor', 'building', 'createdAt', 'updatedAt']);
const SortOrder = z.enum(['asc', 'desc']);

export const GetRoomsQuerySchema = z.object({
  page: z.string().optional().default('1').transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('10').transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)),
  search: z.string().trim().optional(),
  building: z.string().trim().optional(),
  floor: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().optional()),
  minCapacity: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().min(1).optional()),
  maxCapacity: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().min(1).optional()),
  equipment: z.string().trim().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  sortBy: SortableFields.default('createdAt'),
  sortOrder: SortOrder.default('desc'),
});

export const RoomAvailabilityQuerySchema = z.object({
  startDate: z
    .string()
    .datetime({ offset: true })
    .transform((val) => new Date(val)),
  endDate: z
    .string()
    .datetime({ offset: true })
    .transform((val) => new Date(val)),
}).refine((data) => data.endDate > data.startDate, {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;
export type GetRoomsQueryInput = z.infer<typeof GetRoomsQuerySchema>;
export type RoomAvailabilityQueryInput = z.infer<typeof RoomAvailabilityQuerySchema>;


