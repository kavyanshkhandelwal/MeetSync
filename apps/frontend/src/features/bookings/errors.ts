export const ROOM_NO_LONGER_AVAILABLE =
  'This room is no longer available for that time. Please choose another room.';

export function bookingConflictMessage(error: unknown): string | null {
  const err = error as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  const status = err.response?.status;
  const message = err.response?.data?.message || err.message || '';
  if (status === 409 || /already booked/i.test(message)) {
    return ROOM_NO_LONGER_AVAILABLE;
  }
  return null;
}
