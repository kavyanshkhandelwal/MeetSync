import { Request, Response, NextFunction } from 'express';
import { reminderService } from '../services/reminder.service';
import { BookingRepository } from '../repositories/booking.repository';
import { ResponseUtil } from '../utils/response';
import { ForbiddenError, NotFoundError } from '../utils/errors';

const bookingRepository = new BookingRepository();

export class ReminderController {
  async getByBookingId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new ForbiddenError('Not authenticated');
      const { bookingId } = req.params;
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) throw new NotFoundError('Booking not found');
      if (req.user.role !== 'ADMIN' && booking.userId !== req.user.userId) {
        throw new ForbiddenError('You are not authorized to view this reminder');
      }
      const status = await reminderService.status(bookingId);
      ResponseUtil.success(res, status, 'Reminder status retrieved');
    } catch (error) {
      next(error);
    }
  }
}
