import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativePosix, walkFiles } from '../../helpers/srcTree';

describe('frontend AI surface', () => {
  it('has no hosted LLM SDK import in src', () => {
    const src = path.resolve(__dirname, '../../../src');
    const hits = walkFiles(src)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => {
        const text = require('node:fs').readFileSync(file, 'utf8');
        return /from ['"]openai['"]|@anthropic-ai\/sdk|langchain|@google\/generative-ai/i.test(text);
      })
      .map((file) => relativePosix(src, file));
    expect(hits).toEqual([]);
  });

  it('does not depend on the OpenAI SDK in package.json', () => {
    const pkg = require('node:fs').readFileSync(
      path.resolve(__dirname, '../../../package.json'),
      'utf8',
    );
    expect(pkg).not.toMatch(/"openai"/);
  });

  it('has no OpenAI API key and no AI booking endpoint', () => {
    const src = path.resolve(__dirname, '../../../src');
    const hits = walkFiles(src)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => {
        const text = require('node:fs').readFileSync(file, 'utf8');
        return /OPENAI_API_KEY|\/api\/ai\/book|['"]\/ai\/book['"]/.test(text);
      })
      .map((file) => relativePosix(src, file));
    expect(hits).toEqual([]);
  });
});
