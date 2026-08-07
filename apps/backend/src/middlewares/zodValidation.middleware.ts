import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodSchema, ZodRawShape, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export enum RequestPart {
  Body = 'body',
  Params = 'params',
  Query = 'query',
} 

export function validate(
  schema: ZodObject<ZodRawShape>,
  part: RequestPart = RequestPart.Body,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req[part]);
      req[part] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));
        return next(new BadRequestError('Validation failed', errors));
      }
      next(error);
    }
  };
}
