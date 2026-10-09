import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('frontend conflict detection', () => {
  it('createBooking posts the payload and does not compute overlap locally', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../src/features/bookings/api.ts'),
      'utf8',
    );
    expect(source).toContain("apiClient.post('/bookings', data)");
    expect(source).not.toMatch(/overlap|conflict|already booked/i);
  });
});
