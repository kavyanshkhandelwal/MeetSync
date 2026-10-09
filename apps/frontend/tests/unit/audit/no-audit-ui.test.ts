import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { walkFiles } from '../../helpers/srcTree';

describe('frontend audit UI', () => {
  it('exposes an audit page and API module', () => {
    const src = path.resolve(__dirname, '../../../src');
    const files = walkFiles(src).map((f) => f.replace(/\\/g, '/'));
    expect(files.some((f) => f.includes('/audit'))).toBe(true);
  });
});
