import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import { ResponseUtil } from '../utils/response';

const healthService = new HealthService();

export class HealthController {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthResult = await healthService.checkHealth();
      ResponseUtil.success(
        res,
        healthResult,
        healthResult.status === 'healthy' ? 'Service is healthy' : 'Service is unhealthy',
      );
    } catch (error) {
      next(error);
    }
  }
}
