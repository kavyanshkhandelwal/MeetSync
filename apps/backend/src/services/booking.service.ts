import { Booking, Role, BookingStatus } from '@prisma/client';
import { BookingRepository } from '../repositories/booking.repository';
import { RoomRepository } from '../repositories/room.repository';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors';
import { CreateBookingInput, UpdateBookingInput, GetBookingsQueryInput } from '../validators/booking.validator';
import { PaginatedResult } from '../repositories/room.repository';
import socketService from './socket.service';
import { appEventEmitter, EventType } from './eventEmitter.service';
import {
  assertBookingStatusTransition,
  isTerminalBookingStatus,
} from '../domain/bookingStatus.machine';
import { reminderService } from './reminder.service';
import { logger } from '../utils/logger';

async function notifyReminder(label: string, work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (err) {
    logger.error(`${label} failed:`, err instanceof Error ? err.message : err);
  }
}

export class BookingService {
  private bookingRepository: BookingRepository;
  private roomRepository: RoomRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.roomRepository = new RoomRepository();
  }

  async getBookings(
    query: GetBookingsQueryInput,
    userId: string,
    userRole: Role,
  ): Promise<PaginatedResult<Booking>> {
    const isAdmin = userRole === Role.ADMIN;
    return this.bookingRepository.findMany(query, userId, isAdmin);
  }

  async getBookingById(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (userRole !== Role.ADMIN && booking.userId !== userId) {
      throw new ForbiddenError('You are not authorized to view this booking');
    }

    return booking;
  }

  async createBooking(
    input: CreateBookingInput,
    userId: string,
  ): Promise<Booking> {
    // Validate room exists
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check room is active
    if (room.status !== 'ACTIVE') {
      throw new BadRequestError('Room is not available for booking');
    }

    // Create booking in transaction with row locking and conflict check
    try {
      const booking = await this.bookingRepository.createBookingInTransaction(
        {
          startTime: input.startTime,
          endTime: input.endTime,
          purpose: input.purpose,
          status: BookingStatus.PENDING,
          user: { connect: { userId: userId } },
          room: { connect: { roomId: input.roomId } },
        },
        input.roomId,
        input.startTime,
        input.endTime,
      );
      
      // Emit events
      appEventEmitter.emitBookingEvent(EventType.BOOKING_CREATED, {
        bookingId: booking.bookingId,
        userId,
        changes: { ...input },
      });
      
      // Emit socket event
      socketService.emitBookingCreated(booking);
      await notifyReminder('Reminder schedule', () => reminderService.schedule(booking));

      return booking;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Room is already booked')) {
        throw new ConflictError('Room is already booked for this time');
      }
      throw error;
    }
  }

  async updateBooking(
    id: string,
    input: UpdateBookingInput,
    userId: string,
    userRole: Role,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (userRole !== Role.ADMIN && booking.userId !== userId) {
      throw new ForbiddenError('You are not authorized to update this booking');
    }

    const changingNonStatusFields = Boolean(
      input.startTime || input.endTime || input.purpose || input.roomId,
    );
    if (isTerminalBookingStatus(booking.status) && changingNonStatusFields) {
      throw new BadRequestError('Cannot update a completed or cancelled booking');
    }

    const newStartTime = input.startTime || booking.startTime;
    const newEndTime = input.endTime || booking.endTime;
    const roomId = input.roomId || booking.roomId;

    // Time validation (redundant but safe)
    if (newEndTime <= newStartTime) {
      throw new BadRequestError('End time must be after start time');
    }

    // Prepare update data
    const updateData: any = {};
    if (input.startTime) updateData.startTime = input.startTime;
    if (input.endTime) updateData.endTime = input.endTime;
    if (input.purpose) updateData.purpose = input.purpose;
    if (input.roomId) updateData.room = { connect: { roomId: input.roomId } };
    if (input.status) {
      assertBookingStatusTransition(booking.status, input.status, userRole);
      updateData.status = input.status;
    }

    let updatedBooking: Booking;
    
    // Check if we're updating time or room (need conflict check)
    if (input.startTime || input.endTime || input.roomId) {
      try {
        updatedBooking = await this.bookingRepository.updateBookingInTransaction(
          id,
          updateData,
          roomId,
          newStartTime,
          newEndTime,
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('Room is already booked')) {
          throw new ConflictError('Room is already booked for this time');
        }
        throw error;
      }
    } else {
      // No time/room change - simple update
      updatedBooking = await this.bookingRepository.update(id, updateData);
    }
    
    // Emit events
    appEventEmitter.emitBookingEvent(EventType.BOOKING_UPDATED, {
      bookingId: updatedBooking.bookingId,
      userId,
      changes: { ...input },
    });
    
    // Emit socket event
    socketService.emitBookingUpdated(updatedBooking);
    if (input.status === BookingStatus.CANCELLED) {
      await notifyReminder('Reminder cancel', () => reminderService.cancel(updatedBooking));
    } else if (input.status === BookingStatus.COMPLETED) {
      await notifyReminder('Reminder unschedule', () => reminderService.unschedule(updatedBooking));
    } else if (input.startTime || input.endTime) {
      await notifyReminder('Reminder reschedule', () => reminderService.reschedule(updatedBooking));
    }

    return updatedBooking;
  }

  async deleteBooking(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<void> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    if (userRole !== Role.ADMIN && booking.userId !== userId) {
      throw new ForbiddenError('You are not authorized to delete this booking');
    }

    // Check if booking can be deleted
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestError('Cannot delete a completed booking');
    }

    await this.bookingRepository.delete(id);
    await notifyReminder('Reminder unschedule', () => reminderService.unschedule(booking));
    
    // Emit socket event
    socketService.emitBookingCancelled(booking);
  }

  async cancelBooking(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (userRole !== Role.ADMIN && booking.userId !== userId) { 
      throw new ForbiddenError('You are not authorized to cancel this booking');
    }

    assertBookingStatusTransition(booking.status, BookingStatus.CANCELLED, userRole);

    const cancelledBooking = await this.bookingRepository.update(id, { status: BookingStatus.CANCELLED });
    
    // Emit events
    appEventEmitter.emitBookingEvent(EventType.BOOKING_CANCELLED, {
      bookingId: cancelledBooking.bookingId,
      userId,
      changes: { status: BookingStatus.CANCELLED },
    });
    // Emit socket event
    socketService.emitBookingCancelled(cancelledBooking);
    await notifyReminder('Reminder cancel', () => reminderService.cancel(cancelledBooking));
    
    return cancelledBooking;
  }
}
