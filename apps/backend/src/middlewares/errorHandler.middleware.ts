import { Request, Response, NextFunction } from 'express';
import { ApiError, NotFoundError } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  logger.error('Error:', err);

  if (err instanceof ApiError) {
    ResponseUtil.error(res, err.message, err.errors, err.statusCode);
    return;
  }

  // Default error
  const statusCode = 500;
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  ResponseUtil.error(res, message, null, statusCode);
};
