import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const analyticsController = new AnalyticsController();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles(Role.ADMIN));

// Dashboard endpoint - gets all analytics in one request
router.get('/dashboard', analyticsController.getDashboard);

// Individual metrics endpoints
router.get('/total-bookings', analyticsController.getTotalBookings);
router.get('/room-utilization', analyticsController.getRoomUtilization);
router.get('/peak-hours', analyticsController.getPeakHours);
router.get('/most-booked-rooms', analyticsController.getMostBookedRooms);

export default router;
