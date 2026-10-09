import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativePosix, walkFiles } from '../../helpers/srcTree';

const FORBIDDEN = [
  'src/services',
  'src/controllers',
  'src/repositories',
  'src/routes',
  'src/middlewares',
  'src/components',
];

describe('test file placement', () => {
  it('has no *.test.* or *.spec.* files beside application source', () => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    const hits = walkFiles(srcRoot)
      .filter((file) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file))
      .map((file) => relativePosix(srcRoot, file));
    expect(hits).toEqual([]);
  });

  it('keeps the forbidden source folders free of test files', () => {
    const backendRoot = path.resolve(__dirname, '../../..');
    const hits: string[] = [];
    for (const folder of FORBIDDEN) {
      const abs = path.join(backendRoot, folder);
      hits.push(
        ...walkFiles(abs)
          .filter((file) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file))
          .map((file) => relativePosix(backendRoot, file)),
      );
    }
    expect(hits).toEqual([]);
  });
});
