import { Request, Response, NextFunction } from 'express';
import { AuthService, RegisterInput, LoginInput, UpdateProfileInput } from '../services/auth.service';
import { ResponseUtil } from '../utils/response';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: RegisterInput = req.body;
      const result = await authService.register(input);
      ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(input);
      ResponseUtil.success(res, result, 'User logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = await authService.getCurrentUser(req.user.userId);
      ResponseUtil.success(res, user, 'Current user retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const input: UpdateProfileInput = req.body;
      const user = await authService.updateProfile(req.user.userId, input);
      ResponseUtil.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
