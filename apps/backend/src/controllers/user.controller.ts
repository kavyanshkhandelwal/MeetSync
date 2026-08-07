import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { ResponseUtil } from '../utils/response';
import { hashPassword } from '../utils/auth.utils';
import { Role } from '@prisma/client';

const userRepository = new UserRepository();

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role } = req.query;
      
      console.log('GET /users - Query params:', { search, role });
      
      const users = await userRepository.findAll();
      
      console.log('GET /users - Total users from DB:', users.length);
      
      // Filter out password hashes and apply filters
      const filteredUsers = users
        .map(({ passwordHash, ...user }) => user)
        .filter((user) => {
          let matches = true;
          
          if (search) {
            const searchLower = (search as string).toLowerCase();
            matches =
              matches &&
              (user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower));
          }
          
          if (role) {
            matches = matches && user.role === role;
          }
          
          return matches;
        });
      
      console.log('GET /users - Filtered users returned:', filteredUsers.length);
      
      ResponseUtil.success(res, filteredUsers, 'Users retrieved successfully');
    } catch (error) {
      console.error('GET /users - Error:', error);
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userRepository.findById(id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      ResponseUtil.success(res, userWithoutPassword, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const user = await userRepository.create({
        firstName,
        lastName,
        email,
        passwordHash,
        role: role || Role.EMPLOYEE,
      });
      
      const { passwordHash: _, ...userWithoutPassword } = user;
      ResponseUtil.success(res, userWithoutPassword, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role } = req.body;
      
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if email is being changed and if it conflicts with another user
      if (email && email !== user.email) {
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser && existingUser.userId !== id) {
          throw new Error('Email already in use');
        }
      }
      
      const updatedUser = await userRepository.update(id, {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        email: email || user.email,
        role: role || user.role,
      });
      
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      ResponseUtil.success(res, userWithoutPassword, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      
      // Prevent deleting the currently logged-in user
      if (id === currentUserId) {
        throw new Error('Cannot delete your own account');
      }
      
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await userRepository.delete(id);
      ResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
