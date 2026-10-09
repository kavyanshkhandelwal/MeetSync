import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLog.service';
import { ResponseUtil } from '../utils/response';

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const take = Math.min(Number(req.query.limit) || 50, 200);
      const skip = Number(req.query.skip) || 0;
      const logs = await auditLogService.list(skip, take);
      ResponseUtil.success(res, logs, 'Audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
