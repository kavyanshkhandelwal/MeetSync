import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('email and redis credential logging', () => {
  const files = [
    'config/index.ts',
    'config/redis.ts',
    'services/email.service.ts',
    'queues/reminder.queue.ts',
    'workers/reminder.worker.ts',
  ].map((file) => path.resolve(__dirname, '../../../src', file));

  it('does not log mail passwords or redis URLs', () => {
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text).not.toMatch(/console\.(log|info|error|warn)\([^)]*MAIL_PASSWORD/);
      expect(text).not.toMatch(/console\.(log|info|error|warn)\([^)]*REDIS_URL/);
      expect(text).not.toMatch(/logger\.(info|error|warn|debug)\([^)]*MAIL_PASSWORD/);
      expect(text).not.toMatch(/logger\.(info|error|warn|debug)\([^)]*REDIS_URL/);
    }
  });
});
