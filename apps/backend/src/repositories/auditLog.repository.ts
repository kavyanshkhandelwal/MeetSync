import { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class AuditLogRepository {
  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }

  async findAll(
    skip: number = 0,
    take: number = 50,
  ): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }
}
