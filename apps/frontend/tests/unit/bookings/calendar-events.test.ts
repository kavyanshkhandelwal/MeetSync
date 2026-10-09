import { describe, expect, it } from 'vitest';

function mapBookingToEvent(booking: {
  bookingId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  room?: { name: string };
}) {
  return {
    id: booking.bookingId,
    title: `${booking.room?.name || 'Room'} · ${booking.purpose} · ${booking.status}`,
    start: booking.startTime,
    end: booking.endTime,
    extendedProps: {
      status: booking.status,
      purpose: booking.purpose,
    },
  };
}

describe('calendar event mapping', () => {
  it('includes room, purpose, start, end, and status', () => {
    const event = mapBookingToEvent({
      bookingId: 'b1',
      startTime: '2030-09-01T10:00:00.000Z',
      endTime: '2030-09-01T11:00:00.000Z',
      purpose: 'Planning',
      status: 'PENDING',
      room: { name: 'Orion' },
    });
    expect(event.title).toContain('Orion');
    expect(event.title).toContain('Planning');
    expect(event.title).toContain('PENDING');
    expect(event.start).toBe('2030-09-01T10:00:00.000Z');
    expect(event.end).toBe('2030-09-01T11:00:00.000Z');
  });
});
