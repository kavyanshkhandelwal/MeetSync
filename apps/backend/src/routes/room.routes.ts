import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate, authorizeRoles, validate, RequestPart } from '../middlewares';
import { Role } from '@prisma/client';
import { CreateRoomSchema, UpdateRoomSchema, RoomIdSchema, GetRoomsQuerySchema } from '../validators/room.validator';

const router = Router();
const roomController = new RoomController();

// Public/All authenticated: View rooms
router.get(
  '/',
  authenticate,
  validate(GetRoomsQuerySchema, RequestPart.Query),
  roomController.getRooms,
);
router.get(
  '/:id',
  authenticate,
  validate(RoomIdSchema, RequestPart.Params),
  roomController.getRoomById,
);

// ADMIN only: Manage rooms
router.post(
  '/',
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(CreateRoomSchema, RequestPart.Body),
  roomController.createRoom,
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(RoomIdSchema, RequestPart.Params),
  validate(UpdateRoomSchema, RequestPart.Body),
  roomController.updateRoom,
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(RoomIdSchema, RequestPart.Params),
  roomController.deleteRoom,
);

export default router;
