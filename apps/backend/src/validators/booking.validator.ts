// import { z } from 'zod';
// import { BookingStatus } from '@prisma/client';

// export const BookingIdSchema = z.object({
//   id: z.string().uuid('Invalid booking ID'),
// });

// export const CreateBookingSchema = z.object({
//   roomId: z.string().uuid('Invalid room ID'),
//   startTime: z.string().datetime({ offset: true }).transform((val) => new Date(val)),
//   endTime: z.string().datetime({ offset: true }).transform((val) => new Date(val)),
//   purpose: z.string().trim().min(5, 'Purpose must be at least 5 characters').max(500, 'Purpose must be at most 500 characters'),
// }).refine((data) => data.endTime > data.startTime, {
//   message: 'End time must be after start time',
//   path: ['endTime'],
// }).refine((data) => {
//   // Booking must be at least 15 minutes long
//   const diffInMinutes = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60);
//   return diffInMinutes >= 15;
// }, {
//   message: 'Booking must be at least 15 minutes long',
//   path: ['endTime'],
// }).refine((data) => {
//   // Booking can't be longer than 8 hours
//   const diffInHours = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60 * 60);
//   return diffInHours <= 8;
// }, {
//   message: 'Booking can\'t be longer than 8 hours',
//   path: ['endTime'],
// }).refine((data) => {
//   // Booking start time can't be in the past
//   return data.startTime > new Date();
// }, {
//   message: 'Booking start time can\'t be in the past',
//   path: ['startTime'],
// });

// export const UpdateBookingSchema = CreateBookingSchema.partial().extend({
//   status: z.nativeEnum(BookingStatus).optional(),
// });

// export const GetBookingsQuerySchema = z.object({
//   page: z.string().optional().default('1').transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)),
//   limit: z.string().optional().default('10').transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)),
//   roomId: z.string().uuid().optional(),
//   userId: z.string().uuid().optional(),
//   status: z.nativeEnum(BookingStatus).optional(),
//   startDate: z.string().datetime({ offset: true }).optional().transform((val) => val ? new Date(val) : undefined),
//   endDate: z.string().datetime({ offset: true }).optional().transform((val) => val ? new Date(val) : undefined),
// });

// export type BookingIdInput = z.infer<typeof BookingIdSchema>;
// export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
// export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
// export type GetBookingsQueryInput = z.infer<typeof GetBookingsQuerySchema>;







import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const BookingIdSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

/**
 * Base schema without refinements.
 * This allows us to safely use .partial() for update operations.
 */
const BookingBaseSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),

  startTime: z
    .string()
    .datetime({ offset: true })
    .transform((val) => new Date(val)),

  endTime: z
    .string()
    .datetime({ offset: true })
    .transform((val) => new Date(val)),

  purpose: z
    .string()
    .trim()
    .min(5, 'Purpose must be at least 5 characters')
    .max(500, 'Purpose must be at most 500 characters'),
});

/**
 * Create Booking Schema
 */
export const CreateBookingSchema = BookingBaseSchema
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      const diffInMinutes =
        (data.endTime.getTime() - data.startTime.getTime()) /
        (1000 * 60);

      return diffInMinutes >= 15;
    },
    {
      message: 'Booking must be at least 15 minutes long',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      const diffInHours =
        (data.endTime.getTime() - data.startTime.getTime()) /
        (1000 * 60 * 60);

      return diffInHours <= 8;
    },
    {
      message: "Booking can't be longer than 8 hours",
      path: ['endTime'],
    }
  )
  .refine(
    (data) => data.startTime > new Date(),
    {
      message: "Booking start time can't be in the past",
      path: ['startTime'],
    }
  );

/**
 * Update Booking Schema
 * Uses base schema partial() BEFORE refinements.
 */
export const UpdateBookingSchema = BookingBaseSchema
  .partial()
  .extend({
    status: z.nativeEnum(BookingStatus).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const diffInMinutes =
          (data.endTime.getTime() - data.startTime.getTime()) /
          (1000 * 60);

        return diffInMinutes >= 15;
      }
      return true;
    },
    {
      message: 'Booking must be at least 15 minutes long',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const diffInHours =
          (data.endTime.getTime() - data.startTime.getTime()) /
          (1000 * 60 * 60);

        return diffInHours <= 8;
      }
      return true;
    },
    {
      message: "Booking can't be longer than 8 hours",
      path: ['endTime'],
    }
  );

export const GetBookingsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),

  roomId: z.string().uuid().optional(),

  userId: z.string().uuid().optional(),

  status: z.nativeEnum(BookingStatus).optional(),

  startDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),

  endDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export type BookingIdInput = z.infer<typeof BookingIdSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;
export type GetBookingsQueryInput = z.infer<typeof GetBookingsQuerySchema>;