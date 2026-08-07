import { Booking, Role, BookingStatus } from '@prisma/client';
import { BookingRepository } from '../repositories/booking.repository';
import { RoomRepository } from '../repositories/room.repository';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors';
import { CreateBookingInput, UpdateBookingInput, GetBookingsQueryInput } from '../validators/booking.validator';
import { PaginatedResult } from '../repositories/room.repository';
import socketService from './socket.service';
import { appEventEmitter, EventType } from './eventEmitter.service';

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

    // Check if booking can be updated (must not be completed or cancelled)
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
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
      if (userRole !== Role.ADMIN) {
        if (input.status !== BookingStatus.CANCELLED) {
          throw new ForbiddenError('Only admins can update booking status');
        }
      }
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

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Cannot cancel this booking');
    }

    const cancelledBooking = await this.bookingRepository.update(id, { status: BookingStatus.CANCELLED });
    
    // Emit events
    appEventEmitter.emitBookingEvent(EventType.BOOKING_CANCELLED, {
      bookingId: cancelledBooking.bookingId,
      userId,
      changes: { status: BookingStatus.CANCELLED },
    });
    // Emit socket event
    socketService.emitBookingCancelled(cancelledBooking);
    
    return cancelledBooking;
  }
}
