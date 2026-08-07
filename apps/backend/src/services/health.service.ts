import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: number;
}

export class HealthService {
  async checkHealth(): Promise<HealthCheckResult> {
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      database: dbStatus,
      timestamp: Date.now(),
    };
  }
}
