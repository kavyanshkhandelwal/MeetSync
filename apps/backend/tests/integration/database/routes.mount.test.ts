import { describe, expect, it } from 'vitest';
import router from '../../../src/routes/index';

describe('API router mount list', () => {
  it('registers health, auth, rooms, bookings, analytics, and users', () => {
    const layers = router.stack
      .map((layer: any) => layer.regexp?.toString() ?? '')
      .join(' ');

    expect(layers).toMatch(/health/);
    expect(layers).toMatch(/auth/);
    expect(layers).toMatch(/rooms/);
    expect(layers).toMatch(/bookings/);
    expect(layers).toMatch(/analytics/);
    expect(layers).toMatch(/users/);
    expect(layers).toMatch(/ai/);
  });
});
