import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate, validate, RequestPart } from '../middlewares';
import { RecommendQuerySchema } from '../validators/ai.validator';

const router = Router();
const controller = new AiController();

router.use(authenticate);
router.post('/recommend', validate(RecommendQuerySchema, RequestPart.Body), controller.recommend);

export default router;
