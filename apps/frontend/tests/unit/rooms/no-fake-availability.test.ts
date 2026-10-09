import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('room availability UI', () => {
  it('does not keep the fabricated weekday grid', () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, '../../../src/app/rooms/[id]/page.tsx'),
      'utf8',
    );
    expect(page).toContain('AvailabilityPanel');
    expect(page).not.toMatch(/Green days indicate available dates/);
    expect(page).not.toMatch(/Array\.from\(\{ length: 35 \}\)/);
  });

  it('does not keep decorative room edit/delete buttons', () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, '../../../src/app/rooms/page.tsx'),
      'utf8',
    );
    expect(page).toContain('useDeleteRoom');
    expect(page).toContain('/rooms/${room.roomId}/edit');
  });
});
