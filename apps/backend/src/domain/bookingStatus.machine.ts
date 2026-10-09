import { BookingStatus, Role } from '@prisma/client';
import { BadRequestError, ForbiddenError } from '../utils/errors';

/**
 * Formal booking status machine.
 * Identity (same status) is a no-op and is allowed.
 * Terminal states: CANCELLED, COMPLETED.
 */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
};

const ADMIN_ONLY_TARGETS: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
]);

export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return status === BookingStatus.CANCELLED || status === BookingStatus.COMPLETED;
}

export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  if (from === to) {
    return true;
  }
  return BOOKING_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Single gate for every status write. Controllers must not call this;
 * BookingService is the only application caller.
 */
export function assertBookingStatusTransition(
  from: BookingStatus,
  to: BookingStatus,
  role: Role,
): void {
  if (from === to) {
    return;
  }

  if (!canTransitionBookingStatus(from, to)) {
    throw new BadRequestError(`Invalid booking status transition: ${from} → ${to}`);
  }

  if (ADMIN_ONLY_TARGETS.has(to) && role !== Role.ADMIN) {
    throw new ForbiddenError('Only admins can apply this booking status');
  }
}
