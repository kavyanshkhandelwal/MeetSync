import { z } from 'zod';

export const AnalyticsRangeSchema = z
  .object({
    startDate: z.string().min(1, 'startDate is required'),
    endDate: z.string().min(1, 'endDate is required'),
    limit: z.coerce.number().int().positive().max(50).optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startDate is invalid', path: ['startDate'] });
    }
    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'endDate is invalid', path: ['endDate'] });
    }
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be after startDate',
        path: ['endDate'],
      });
    }
  });

export type AnalyticsRangeInput = z.infer<typeof AnalyticsRangeSchema>;
