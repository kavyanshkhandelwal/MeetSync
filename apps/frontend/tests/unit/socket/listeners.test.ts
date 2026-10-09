import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('frontend socket listeners', () => {
  it('registers booking and room listeners and cleans them up', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/lib/react-query.tsx'),
      'utf8',
    );
    expect(source).toContain("socket.on('ROOM_BOOKED'");
    expect(source).toContain("socket.on('ROOM_CANCELLED'");
    expect(source).toContain("socket.on('BOOKING_UPDATED'");
    expect(source).toContain("socket.on('ROOM_UPDATED'");
    expect(source).toContain("socket.on('ROOM_DELETED'");
    expect(source).toContain("socket.off('ROOM_BOOKED'");
    expect(source).toContain("socket.off('ROOM_DELETED'");
    expect(source).toContain("queryKey: ['bookings']");
    expect(source).toContain("queryKey: ['room-availability']");
    expect(source).toContain("queryKey: ['rooms']");
  });

  it('connects the socket after login using the stored token', () => {
    const hooks = fs.readFileSync(
      path.resolve(__dirname, '../../../src/features/auth/hooks.ts'),
      'utf8',
    );
    expect(hooks).toContain('connectSocket()');
    expect(hooks).toContain('disconnectSocket()');
  });
});
