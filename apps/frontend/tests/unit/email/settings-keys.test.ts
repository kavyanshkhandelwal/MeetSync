import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('email settings (frontend)', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../../src/app/settings/page.tsx'),
    'utf8',
  );

  it('persists reminder and email toggles only in localStorage', () => {
    expect(source).toContain("localStorage.setItem('bookingReminders'");
    expect(source).toContain("localStorage.setItem('emailNotifications'");
    expect(source).not.toMatch(/apiClient|\/api\/email|nodemailer/);
  });
});
