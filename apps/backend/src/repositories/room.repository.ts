import { Room, Prisma, RoomStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BaseRepository } from './base.repository';
import { GetRoomsQueryInput } from '../validators/room.validator';

export type RoomCandidateFilters = {
  search?: string;
  building?: string;
  floor?: number;
  minCapacity?: number;
  maxCapacity?: number;
  equipment?: string;
  equipments?: string[];
  status?: RoomStatus;
};

export function buildRoomWhere(query: RoomCandidateFilters): Prisma.RoomWhereInput {
  const where: Prisma.RoomWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { building: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.building) {
    where.building = { equals: query.building, mode: 'insensitive' };
  }

  if (query.floor !== undefined) {
    where.floor = query.floor;
  }

  if (query.minCapacity !== undefined || query.maxCapacity !== undefined) {
    where.capacity = {
      ...(query.minCapacity !== undefined ? { gte: query.minCapacity } : {}),
      ...(query.maxCapacity !== undefined ? { lte: query.maxCapacity } : {}),
    };
  }

  if (query.equipments && query.equipments.length > 0) {
    where.equipments = { hasEvery: query.equipments };
  } else if (query.equipment) {
    where.equipments = { has: query.equipment };
  }

  if (query.status) {
    where.status = query.status;
  }

  return where;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class RoomRepository extends BaseRepository<Room> {
  async findAll(): Promise<Room[]> {
    return prisma.room.findMany();
  }

  async findMatching(filters: RoomCandidateFilters): Promise<Room[]> {
    return prisma.room.findMany({
      where: buildRoomWhere(filters),
      orderBy: { name: 'asc' },
    });
  }

  async findMany(query: GetRoomsQueryInput): Promise<PaginatedResult<Room>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const where = buildRoomWhere(filters);

    const skip = (page - 1) * limit;
    const orderBy: Prisma.RoomOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };
    
    const [rooms, total] = await prisma.$transaction([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.room.count({ where }),
    ]);

    return {
      data: rooms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Room | null> {
    return prisma.room.findUnique({ where: { roomId: id } });
  }

  async create(data: Prisma.RoomCreateInput): Promise<Room> {
    return prisma.room.create({ data });
  }

  async update(id: string, data: Prisma.RoomUpdateInput): Promise<Room> {
    return prisma.room.update({ where: { roomId: id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.room.delete({ where: { roomId: id } });
  }
}
