import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('socket authentication logging', () => {
  it('does not log handshake tokens or JWT values', () => {
    const files = [
      path.resolve(__dirname, '../../../src/middlewares/socketAuth.ts'),
      path.resolve(__dirname, '../../../src/services/socket.service.ts'),
    ];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text).not.toMatch(/console\.log\([^)]*token/i);
      expect(text).not.toMatch(/console\.log\([^)]*auth/i);
      expect(text).not.toMatch(/Generated Access Token/i);
    }
  });
});
