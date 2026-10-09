import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Socket.IO wire names in production source', () => {
  it('emits ROOM_BOOKED, BOOKING_UPDATED, ROOM_CANCELLED, ROOM_UPDATED', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/services/socket.service.ts'),
      'utf8',
    );
    expect(source).toContain("this.emit('ROOM_BOOKED'");
    expect(source).toContain("this.emit('BOOKING_UPDATED'");
    expect(source).toContain("this.emit('ROOM_CANCELLED'");
    expect(source).toContain("this.emit('ROOM_UPDATED'");
    expect(source).toContain("this.emit('ROOM_DELETED'");
  });

  it('authenticates the handshake with the shared JWT helper', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/services/socket.service.ts'),
      'utf8',
    );
    expect(source).toContain('authenticateSocket');
    expect(source).toContain('this.io.use(authenticateSocket)');
  });
});
