import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativePosix, walkFiles } from '../../helpers/srcTree';

describe('frontend test file placement', () => {
  it('has no *.test.* or *.spec.* files under src/', () => {
    const src = path.resolve(__dirname, '../../../src');
    const hits = walkFiles(src)
      .filter((file) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file))
      .map((file) => relativePosix(src, file));
    expect(hits).toEqual([]);
  });

  it('has no tests inside src/components', () => {
    const components = path.resolve(__dirname, '../../../src/components');
    const hits = walkFiles(components).filter((file) =>
      /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file),
    );
    expect(hits).toEqual([]);
  });
});
