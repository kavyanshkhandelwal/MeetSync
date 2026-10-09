import { afterEach, describe, expect, it } from 'vitest';
import { ActionType, EntityType } from '@prisma/client';
import { auditLogService } from '../../../src/services/auditLog.service';
import { AuditLogRepository } from '../../../src/repositories/auditLog.repository';
import { EventType, appEventEmitter } from '../../../src/services/eventEmitter.service';
import { BOOKING_ID, USER_ID } from '../../fixtures/ids';

function wait(ms = 20): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('AuditLogService (integration, repository stubbed)', () => {
  const originalCreate = AuditLogRepository.prototype.create;

  afterEach(() => {
    AuditLogRepository.prototype.create = originalCreate;
  });

  it('uses a single module singleton listener set', () => {
    void auditLogService;
    expect(appEventEmitter.listenerCount(EventType.BOOKING_CREATED)).toBe(1);
    expect(appEventEmitter.listenerCount(EventType.BOOKING_CANCELLED)).toBe(1);
  });

  it('writes a BOOKING_CREATED audit row when the event is emitted', async () => {
    const writes: any[] = [];
    AuditLogRepository.prototype.create = async (data: any) => {
      writes.push(data);
      return data;
    };

    appEventEmitter.emitBookingEvent(EventType.BOOKING_CREATED, {
      bookingId: BOOKING_ID,
      userId: USER_ID,
      changes: { purpose: 'Audit test' },
    });
    await wait();

    expect(writes).toHaveLength(1);
    expect(writes[0].action).toBe(ActionType.BOOKING_CREATED);
    expect(writes[0].entityType).toBe(EntityType.BOOKING);
    expect(writes[0].entityId).toBe(BOOKING_ID);
    expect(writes[0].user).toEqual({ connect: { userId: USER_ID } });
  });

  it('does not rethrow when the audit write fails', async () => {
    AuditLogRepository.prototype.create = async () => {
      throw new Error('audit table down');
    };
    expect(() =>
      appEventEmitter.emitBookingEvent(EventType.BOOKING_CANCELLED, {
        bookingId: BOOKING_ID,
        userId: USER_ID,
      }),
    ).not.toThrow();
    await wait();
  });
});
