import { PrismaClient } from '@prisma/client';
import { env } from './index';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL via Prisma');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
