import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const routes = fs.readFileSync(
  path.resolve(__dirname, '../../../src/routes/room.routes.ts'),
  'utf8',
);

describe('room route authorization', () => {
  it('requires ADMIN for create, update, and delete', () => {
    expect(routes).toContain('authorizeRoles(Role.ADMIN)');
    expect(routes).toMatch(/router\.post\(\s*'\/'/);
    expect(routes).toMatch(/router\.put\(\s*'\/:id'/);
    expect(routes).toMatch(/router\.delete\(\s*'\/:id'/);
  });

  it('allows any authenticated user to list rooms and view availability', () => {
    expect(routes).toContain("router.get(");
    expect(routes).toContain('/:id/availability');
    expect(routes).toContain('authenticate');
  });
});
