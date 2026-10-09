import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller';
import { authenticate } from '../middlewares';

const router = Router();
const controller = new ReminderController();

router.use(authenticate);
router.get('/:bookingId', controller.getByBookingId);

export default router;
