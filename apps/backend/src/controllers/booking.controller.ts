import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { ResponseUtil } from '../utils/response';

const bookingService = new BookingService();

export class BookingController {
  async getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const result = await bookingService.getBookings(
        req.query as any,
        req.user.userId,
        req.user.role,
      );
      ResponseUtil.success(res, result, 'Bookings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const { id } = req.params;
      const booking = await bookingService.getBookingById(
        id,
        req.user.userId,
        req.user.role,
      );
      ResponseUtil.success(res, booking, 'Booking retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const booking = await bookingService.createBooking(
        req.body,
        req.user.userId,
      );
      ResponseUtil.created(res, booking, 'Booking created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const { id } = req.params;
      const booking = await bookingService.updateBooking(
        id,
        req.body,
        req.user.userId,
        req.user.role,
      );
      ResponseUtil.success(res, booking, 'Booking updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const { id } = req.params;
      await bookingService.deleteBooking(
        id,
        req.user.userId,
        req.user.role,
      );
      ResponseUtil.success(res, null, 'Booking deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const { id } = req.params;
      const booking = await bookingService.cancelBooking(
        id,
        req.user.userId,
        req.user.role,
      );
      ResponseUtil.success(res, booking, 'Booking cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
