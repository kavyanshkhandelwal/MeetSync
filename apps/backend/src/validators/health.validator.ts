import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

// Example validator
export const validateHealthCheck = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // No validation needed for health check, this is just an example
  // In real routes, you'd validate req.body, req.params, req.query here
  next();
};
