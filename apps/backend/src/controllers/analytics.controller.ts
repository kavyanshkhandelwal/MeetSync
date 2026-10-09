import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ResponseUtil } from '../utils/response';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const analytics = await analyticsService.getDashboardAnalytics(startDate, endDate);
      ResponseUtil.success(res, analytics, 'Dashboard analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTotalBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const result = await analyticsService.getTotalBookings(startDate, endDate);
      ResponseUtil.success(res, result, 'Total bookings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRoomUtilization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const result = await analyticsService.getRoomUtilization(startDate, endDate);
      ResponseUtil.success(res, result, 'Room utilization retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPeakHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const result = await analyticsService.getPeakHours(startDate, endDate);
      ResponseUtil.success(res, result, 'Peak hours retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMostBookedRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, startDate, endDate } = req.query as {
        limit?: string;
        startDate?: string;
        endDate?: string;
      };
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      const result = await analyticsService.getMostBookedRooms(limitNum, startDate, endDate);
      ResponseUtil.success(res, result, 'Most booked rooms retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
