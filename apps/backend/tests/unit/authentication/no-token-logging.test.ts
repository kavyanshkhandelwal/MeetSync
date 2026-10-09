import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativePosix, walkFiles } from '../../helpers/srcTree';

describe('authentication logging', () => {
  it('does not log JWT or access-token values from backend src', () => {
    const src = path.resolve(__dirname, '../../../src');
    const hits = walkFiles(src)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => {
        const text = fs.readFileSync(file, 'utf8');
        return /Generated Access Token|console\.log\([^)]*accessToken|console\.log\([^)]*refreshToken/i.test(
          text,
        );
      })
      .map((file) => relativePosix(src, file));

    expect(hits).toEqual([]);
  });

  it('does not contain the retired production JWT fallback string', () => {
    const src = path.resolve(__dirname, '../../../src');
    const hits = walkFiles(src)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) =>
        fs.readFileSync(file, 'utf8').includes('super-secret-jwt-key-change-me-in-production'),
      )
      .map((file) => relativePosix(src, file));

    expect(hits).toEqual([]);
  });
});
