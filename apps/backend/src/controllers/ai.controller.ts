import { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendation.service';
import { ResponseUtil } from '../utils/response';
import { RecommendQueryInput } from '../validators/ai.validator';

export class AiController {
  async recommend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, constraints } = req.body as RecommendQueryInput;
      const result = await recommendationService.recommend(query, new Date(), constraints);
      ResponseUtil.success(res, result, 'Recommendations generated');
    } catch (error) {
      next(error);
    }
  }
}
