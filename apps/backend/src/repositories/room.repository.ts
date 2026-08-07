import { Room, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BaseRepository } from './base.repository';
import { GetRoomsQueryInput } from '../validators/room.validator';

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

  async findMany(query: GetRoomsQueryInput): Promise<PaginatedResult<Room>> {
    const { 
      page, 
      limit, 
      search, 
      building, 
      floor, 
      minCapacity, 
      maxCapacity, 
      status,
      sortBy,
      sortOrder,
    } = query;
    
    const where: Prisma.RoomWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (building) {
      where.building = { equals: building, mode: 'insensitive' };
    }
    
    if (floor !== undefined) {
      where.floor = floor;
    }
    
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      where.capacity = {
        ...(minCapacity !== undefined ? { gte: minCapacity } : {}),
        ...(maxCapacity !== undefined ? { lte: maxCapacity } : {}),
      };
    }
    
    if (status) {
      where.status = status;
    }

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
