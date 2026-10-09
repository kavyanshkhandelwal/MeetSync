import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service';
import { ResponseUtil } from '../utils/response';
import { GetRoomsQueryInput, RoomAvailabilityQueryInput } from '../validators/room.validator';

const roomService = new RoomService();

export class RoomController {
  async getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as GetRoomsQueryInput;
      const result = await roomService.getRooms(query);
      ResponseUtil.success(res, result, 'Rooms retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRoomById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.getRoomById(id);
      ResponseUtil.success(res, room, 'Room retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const room = await roomService.createRoom(req.body, req.user.userId);
      ResponseUtil.created(res, room, 'Room created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new Error('Unauthorized');
      const { id } = req.params;
      const room = await roomService.updateRoom(id, req.body, req.user.userId);
      ResponseUtil.success(res, room, 'Room updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await roomService.deleteRoom(id);
      ResponseUtil.success(res, null, 'Room deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const query = req.query as unknown as RoomAvailabilityQueryInput;
      const result = await roomService.getAvailability(id, query);
      ResponseUtil.success(res, result, 'Room availability retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
