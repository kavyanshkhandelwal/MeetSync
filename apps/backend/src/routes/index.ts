import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import roomRoutes from './room.routes';
import bookingRoutes from './booking.routes';
import analyticsRoutes from './analytics.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/users', userRoutes);

export default router;
