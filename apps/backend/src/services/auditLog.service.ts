import { Role, ActionType, EntityType } from '@prisma/client';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { appEventEmitter, EventType, BookingEventData, RoomEventData } from './eventEmitter.service';

export class AuditLogService {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
    this.setupEventListeners();
  }

  async list(skip = 0, take = 50) {
    const logs = await this.auditLogRepository.findAll(skip, take);
    return logs.map((log: any) => {
      if (log.user?.passwordHash) {
        const { passwordHash, ...user } = log.user;
        return { ...log, user };
      }
      return log;
    });
  }

  private setupEventListeners(): void {
    // Booking events
    appEventEmitter.on(EventType.BOOKING_CREATED, async (data: BookingEventData) => {
      await this.logAuditEvent({
        userId: data.userId,
        action: ActionType.BOOKING_CREATED,
        entityType: EntityType.BOOKING,
        entityId: data.bookingId,
        details: data.changes,
      });
    });

    appEventEmitter.on(EventType.BOOKING_UPDATED, async (data: BookingEventData) => {
      await this.logAuditEvent({
        userId: data.userId,
        action: ActionType.BOOKING_UPDATED,
        entityType: EntityType.BOOKING,
        entityId: data.bookingId,
        details: data.changes,
      });
    });

    appEventEmitter.on(EventType.BOOKING_CANCELLED, async (data: BookingEventData) => {
      await this.logAuditEvent({
        userId: data.userId,
        action: ActionType.BOOKING_CANCELLED,
        entityType: EntityType.BOOKING,
        entityId: data.bookingId,
        details: data.changes,
      });
    });

    // Room events
    appEventEmitter.on(EventType.ROOM_CREATED, async (data: RoomEventData) => {
      await this.logAuditEvent({
        userId: data.userId,
        action: ActionType.ROOM_CREATED,
        entityType: EntityType.ROOM,
        entityId: data.roomId,
        details: data.changes,
      });
    });

    appEventEmitter.on(EventType.ROOM_UPDATED, async (data: RoomEventData) => {
      await this.logAuditEvent({
        userId: data.userId,
        action: ActionType.ROOM_UPDATED,
        entityType: EntityType.ROOM,
        entityId: data.roomId,
        details: data.changes,
      });
    });
  }

  private async logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
    details,
  }: {
    userId: string;
    action: ActionType;
    entityType: EntityType;
    entityId: string;
    details?: any;
  }): Promise<void> {
    try {
      await this.auditLogRepository.create({
        user: { connect: { userId: userId } },
        action,
        entityType,
        entityId,
        details,
      });
    } catch (error) {
      console.error('[AuditLog] Failed to create audit log:', error);
      // Don't rethrow - we don't want audit log failure to block main operations!
    }
  }
}

export const auditLogService = new AuditLogService();
