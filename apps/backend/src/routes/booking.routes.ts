import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, authorizeRoles, validate, RequestPart } from '../middlewares';
import { Role } from '@prisma/client';
import {
  BookingIdSchema,
  CreateBookingSchema,
  UpdateBookingSchema,
  GetBookingsQuerySchema,
} from '../validators/booking.validator';

const router = Router();
const bookingController = new BookingController();

// All routes require authentication
router.use(authenticate);

router.get(
  '/',
  validate(GetBookingsQuerySchema, RequestPart.Query),
  bookingController.getBookings,
);

router.get(
  '/:id',
  validate(BookingIdSchema, RequestPart.Params),
  bookingController.getBookingById,
);

router.post(
  '/',
  validate(CreateBookingSchema, RequestPart.Body),
  bookingController.createBooking,
);

router.put(
  '/:id',
  validate(BookingIdSchema, RequestPart.Params),
  validate(UpdateBookingSchema, RequestPart.Body),
  bookingController.updateBooking,
);

router.delete(
  '/:id',
  validate(BookingIdSchema, RequestPart.Params),
  bookingController.deleteBooking,
);

router.patch(
  '/:id/cancel',
  validate(BookingIdSchema, RequestPart.Params),
  bookingController.cancelBooking,
);

export default router;
