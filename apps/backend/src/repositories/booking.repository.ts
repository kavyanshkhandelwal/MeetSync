// import { Booking, Prisma, BookingStatus } from '@prisma/client';
// import { prisma } from '../config/prisma';
// import { BaseRepository } from './base.repository';
// import { GetBookingsQueryInput } from '../validators/booking.validator';
// import { PaginatedResult } from './room.repository';

// export class BookingRepository extends BaseRepository<Booking> {
//   async findAll(): Promise<Booking[]> {
//     return prisma.booking.findMany({
//       include: { user: true, room: true },
//     });
//   }

//   async findMany(
//     query: GetBookingsQueryInput,
//     userId?: string,
//     isAdmin?: boolean,
//   ): Promise<PaginatedResult<Booking>> {
//     const { page, limit, roomId, status, startDate, endDate } = query;

//     const where: Prisma.BookingWhereInput = {};

//     if (!isAdmin && userId) {
//       where.userId = userId;
//     } else if (query.userId) {
//       where.userId = query.userId;
//     }

//     if (roomId) {
//       where.room_id = roomId;
//     }

//     if (status) {
//       where.status = status;
//     }

//     if (startDate || endDate) {
//       where.AND = [];
//       if (startDate) {
//         where.AND.push({ startTime: { gte: startDate } });
//       }
//       if (endDate) {
//         where.AND.push({ endTime: { lte: endDate } });
//       }
//     }

//     const skip = (page - 1) * limit;

//     const [bookings, total] = await prisma.$transaction([
//       prisma.booking.findMany({
//         where,
//         skip,
//         take: limit,
//         include: { user: true, room: true },
//         orderBy: { startTime: 'asc' }, 
//       }),
//       prisma.booking.count({ where }),
//     ]);

//     return {
//       data: bookings,
//       meta: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     };
//   }

//   async findById(id: string): Promise<Booking | null> {
//     return prisma.booking.findUnique({
//       where: { bookingId: id },
//       include: { user: true, room: true },
//     });
//   }

//   async findByUserId(userId: string): Promise<Booking[]> {
//     return prisma.booking.findMany({
//       where: { userId: userId },
//       include: { user: true, room: true },
//     });
//   }

//   async create(data: Prisma.BookingCreateInput): Promise<Booking> {
//     return prisma.booking.create({
//       data,
//       include: { user: true, room: true },
//     });
//   }

//   async update(id: string, data: Prisma.BookingUpdateInput): Promise<Booking> {
//Replace update method to use camelCase field names
//     return prisma.booking.update({
//       where: { bookingId: id },
//       data,
//       include: { user: true, room: true },
//     });
//   }

//   async delete(id: string): Promise<void> {
//     await prisma.booking.delete({ where: { bookingId: id } }); 
//   }

//   /**
//    * Check for conflicting bookings in a transaction with row locking
//    * @param tx Prisma transaction client
//    * @param roomId Room ID
//    * @param startTime New booking start time
//    * @param endTime New booking end time
//    * @param excludeBookingId Booking ID to exclude from checks
//    * @returns Conflicting booking if found
//    */
//   async checkForConflictingBookingInTransaction(
//     tx: Prisma.TransactionClient,
//     roomId: string,
//     startTime: Date,
//     endTime: Date,
//     excludeBookingId?: string,
//   ): Promise<Booking | null> {
//     // First lock the room to prevent race conditions
//     await tx.room.findUnique({
//       where: { roomId: roomId },
//       lock: { mode: Prisma.LockMode.PESSIMISTIC_WRITE },
//     });

//     // Now check for conflicts with the lock held
//     return tx.booking.findFirst({
//       where: {
//         roomId: roomId,
//         bookingId: excludeBookingId ? { not: excludeBookingId } : undefined,
//         status: { not: BookingStatus.CANCELLED },
//         AND: [
//           { startTime: { lt: endTime } },
//           { endTime: { gt: startTime } },   
//         ],
//       },
//     });
//   }

//   /**
//    * Create a booking in a transaction with conflict checking and row locking
//    */
//   async createBookingInTransaction(
//     data: Prisma.BookingCreateInput,
//     roomId: string,
//     startTime: Date,
//     endTime: Date,
//   ): Promise<Booking> {
//     return prisma.$transaction(async (tx) => {
//       // Lock the room row to prevent concurrent modifications
//       await tx.room.findUnique({
//         where: { roomId: roomId },
//         lock: { mode: Prisma.LockMode.PESSIMISTIC_WRITE },
//       });

//       // Check for conflicts with the lock held
//       const conflict = await tx.booking.findFirst({
//         where: {
//           roomId: roomId,
//           status: { not: BookingStatus.CANCELLED },
//           AND: [
//             { startTime: { lt: endTime } },
//             { endTime: { gt: startTime } },
//           ],
//         },
//       });

//       if (conflict) {
//         throw new Error('Room is already booked for this time');
//       }

//       // Create the booking inside the transaction
//       return tx.booking.create({
//         data,
//         include: { user: true, room: true },
//       });
//     });
//   }

//   /**
//    * Update a booking in a transaction with conflict checking and row locking
//    */
//   async updateBookingInTransaction(
//     id: string,
//     data: Prisma.BookingUpdateInput,
//     roomId: string,
//     startTime: Date,
//     endTime: Date,
//   ): Promise<Booking> {
//     return prisma.$transaction(async (tx) => {
//       // Lock the room row
//       await tx.room.findUnique({
//         where: { roomId: roomId },
//         lock: { mode: Prisma.LockMode.PESSIMISTIC_WRITE },
//       });

//       // Check for conflicts excluding the current booking
//       const conflict = await tx.booking.findFirst({
//         where: {
//           roomId: roomId,
//           bookingId: { not: id },
//           status: { not: BookingStatus.CANCELLED },
//           AND: [
//             { startTime: { lt: endTime } },
//             { endTime: { gt: startTime } },  
//           ],
//         },
//       });

//       if (conflict) {
//         throw new Error('Room is already booked for this time');
//       }

//       // Update the booking inside the transaction
//       return tx.booking.update({
//         where: { bookingId: id },    
//         data,
//         include: { user: true, room: true },
//       });
//     });
//   }
// }



import { Booking, Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BaseRepository } from './base.repository';
import { GetBookingsQueryInput } from '../validators/booking.validator';
import { PaginatedResult } from './room.repository';

export class BookingRepository extends BaseRepository<Booking> {
  async findAll(): Promise<any[]> {
    return prisma.booking.findMany({
      include: {
        user: true,
        room: true,
      },
    });
  }

  async findMany(
    query: GetBookingsQueryInput,
    userId?: string,
    isAdmin?: boolean,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      roomId,
      status,
      startDate,
      endDate,
    } = query;

    const where: Prisma.BookingWhereInput = {};

    if (!isAdmin && userId) {
      where.userId = userId;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      const andConditions: Prisma.BookingWhereInput[] = [];

      if (startDate) {
        andConditions.push({
          startTime: {
            gte: new Date(startDate),
          },
        });
      }

      if (endDate) {
        andConditions.push({
          endTime: {
            lte: new Date(endDate),
          },
        });
      }

      where.AND = andConditions;
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          room: true,
        },
        orderBy: {
          startTime: 'asc', 
        },
      }),
      prisma.booking.count({
        where,
      }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<any | null> {
    return prisma.booking.findUnique({
      where: {
        bookingId: id,
      },
      include: {
        user: true,
        room: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<any[]> {
    return prisma.booking.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: true,
        room: true,
      },
      orderBy: {
        startTime: 'asc', 
      },
    });
  }

  async create(data: Prisma.BookingCreateInput): Promise<any> {
    return prisma.booking.create({
      data,
      include: {
        user: true,
        room: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.BookingUpdateInput,
  ): Promise<any> {
    return prisma.booking.update({
      where: {
        bookingId: id,
      },
      data,
      include: {
        user: true,
        room: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.booking.delete({
      where: {
        bookingId: id,
      },
    });
  }

  /**
  
  * Checks whether a room already has a booking
  * overlapping the requested time range.
    */
  async checkForConflictingBookingInTransaction(
    tx: Prisma.TransactionClient,
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ) {
    return tx.booking.findFirst({
      where: {
        roomId: roomId,
        status: {
          not: BookingStatus.CANCELLED,
        },
        ...(excludeBookingId && {
          bookingId: {
            not: excludeBookingId,
          },
        }),
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });
  }

  /**
  
  * Creates a booking with conflict validation.
    */
  async createBookingInTransaction(
    data: Prisma.BookingCreateInput,
    roomId: string,
    startTime: Date,
    endTime: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      const conflict =
        await this.checkForConflictingBookingInTransaction(
          tx,
          roomId,
          startTime,
          endTime,
        );

      if (conflict) {
        throw new Error(
          'Room is already booked for the selected time slot',
        );
      }

      return tx.booking.create({
        data,
        include: {
          user: true,
          room: true,
        },
      });
    });
  }

  /**
  
  * Updates a booking with conflict validation.
    */
  async updateBookingInTransaction(
    id: string,
    data: Prisma.BookingUpdateInput,
    roomId: string,
    startTime: Date,
    endTime: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      const conflict =
        await this.checkForConflictingBookingInTransaction(
          tx,
          roomId,
          startTime,
          endTime,
          id,
        );

      if (conflict) {
        throw new Error(
          'Room is already booked for the selected time slot',
        );
      }

      return tx.booking.update({
        where: {
          bookingId: id,
        },
        data,
        include: {
          user: true,
          room: true,
        },
      });
    });
  }
}
