import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { walk } from '../../helpers/ai.probe';

const BACKEND_SRC = path.resolve(__dirname, '../../../src');
const FRONTEND_SRC = path.resolve(__dirname, '../../../../frontend/src');

function files(root: string) {
  return walk(root).filter((file) => /\.(ts|tsx)$/.test(file));
}

describe('OpenAI key is not exposed', () => {
  it('backend never logs or returns OPENAI_API_KEY', () => {
    const hits = files(BACKEND_SRC).filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return /logger\.(?:info|warn|error|debug)\([^)]*OPENAI_API_KEY/.test(text) ||
        /res\.(?:json|send)\([^)]*OPENAI_API_KEY/.test(text);
    });
    expect(hits).toEqual([]);
  });

  it('frontend source never mentions OPENAI_API_KEY or the OpenAI SDK', () => {
    const hits = files(FRONTEND_SRC).filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return /OPENAI_API_KEY|from ['"]openai['"]|next\/openai/i.test(text);
    });
    expect(hits).toEqual([]);
  });
});
