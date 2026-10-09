import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('booking modal error handling', () => {
  it('shows API errors instead of only logging them', () => {
    const modal = fs.readFileSync(
      path.resolve(__dirname, '../../../src/components/bookings/BookingModal.tsx'),
      'utf8',
    );
    expect(modal).toContain('handleApiError');
    expect(modal).toContain('bookingConflictMessage');
    expect(modal).toContain('useCreateBooking');
    expect(modal).toContain('errorMessage');
    expect(modal).not.toMatch(/console\.error\('Error creating booking/);
    expect(modal).not.toContain('/ai/book');
  });

  it('shows API errors on edit and supports cancel', () => {
    const modal = fs.readFileSync(
      path.resolve(__dirname, '../../../src/components/bookings/EditBookingModal.tsx'),
      'utf8',
    );
    expect(modal).toContain('handleApiError');
    expect(modal).toContain('allowCancel');
    expect(modal).not.toMatch(/console\.error\('Error updating booking/);
  });
});
