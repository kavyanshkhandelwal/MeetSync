import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { userId: id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { userId: id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { userId: id } });
  }
}
