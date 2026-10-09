import { z } from 'zod';

export const ExtractedRequirementsSchema = z
  .object({
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    equipment: z.array(z.string()),
    building: z.string().trim().min(1).optional(),
    floor: z.number().int().optional(),
    purpose: z.string().trim().min(5).max(500).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const start = new Date(value.startTime);
    const end = new Date(value.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Times must be valid datetimes', path: ['startTime'] });
      return;
    }
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime'],
      });
    }
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (minutes < 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Booking must be at least 15 minutes long',
        path: ['endTime'],
      });
    }
    if (minutes > 8 * 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Booking can't be longer than 8 hours",
        path: ['endTime'],
      });
    }
    if (start <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Booking start time can't be in the past",
        path: ['startTime'],
      });
    }
  });

export const RecommendQuerySchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1, 'Query is required')
      .max(500, 'Query must be at most 500 characters'),
    constraints: ExtractedRequirementsSchema.optional(),
  })
  .strict();

/** Shape-only schema for untrusted model JSON. Unknown fields fail. */
export const LlmConstraintSchema = z
  .object({
    capacity: z.number().int().min(1),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    equipment: z.array(z.string()),
    building: z.string().trim().min(1).nullish(),
    floor: z.number().int().nullish(),
    purpose: z.string().trim().min(5).max(500).nullish(),
  })
  .strict();

export const LLM_CONSTRAINT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    capacity: { type: 'integer', minimum: 1 },
    startTime: { type: 'string', description: 'ISO-8601 datetime with timezone offset' },
    endTime: { type: 'string', description: 'ISO-8601 datetime with timezone offset' },
    equipment: { type: 'array', items: { type: 'string' } },
    building: { type: ['string', 'null'] },
    floor: { type: ['integer', 'null'] },
    purpose: { type: ['string', 'null'] },
  },
  required: ['capacity', 'startTime', 'endTime', 'equipment', 'building', 'floor', 'purpose'],
} as const;

export type RecommendQueryInput = z.infer<typeof RecommendQuerySchema>;
export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;
