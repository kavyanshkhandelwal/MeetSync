import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, authorizeRoles, validate, RequestPart } from '../middlewares';
import { Role } from '@prisma/client';
import { AnalyticsRangeSchema } from '../validators/analytics.validator';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticate);
router.use(authorizeRoles(Role.ADMIN));
router.use(validate(AnalyticsRangeSchema, RequestPart.Query));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/total-bookings', analyticsController.getTotalBookings);
router.get('/room-utilization', analyticsController.getRoomUtilization);
router.get('/peak-hours', analyticsController.getPeakHours);
router.get('/most-booked-rooms', analyticsController.getMostBookedRooms);

export default router;
