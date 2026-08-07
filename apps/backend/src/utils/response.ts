import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
  meta?: {
    timestamp: number;
  };
}

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      meta: {
        timestamp: Date.now(),
      },
    });
  }

  static error(
    res: Response,
    message: string = 'Error',
    errors?: any,
    statusCode: number = 500,
  ): Response<ApiResponse<any>> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      meta: {
        timestamp: Date.now(),
      },
    });
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, 201);
  }
}
