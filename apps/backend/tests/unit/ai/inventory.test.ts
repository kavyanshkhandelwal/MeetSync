import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AI_DEP_NAMES,
  FORBIDDEN_BACKEND_AI_DEPS,
  backendModuleExists,
  backendPkg,
  frontendPkg,
} from '../../helpers/ai.probe';

describe('AI recommendation inventory (unit)', () => {
  it('backend may only use the official OpenAI SDK for extraction', () => {
    const deps = { ...backendPkg().dependencies, ...backendPkg().devDependencies };
    expect(deps.openai).toBeTruthy();
    expect(FORBIDDEN_BACKEND_AI_DEPS.filter((name) => deps[name])).toEqual([]);
  });

  it('no AI SDK is a frontend dependency', () => {
    const deps = { ...frontendPkg().dependencies, ...frontendPkg().devDependencies };
    expect(AI_DEP_NAMES.filter((name) => deps[name])).toEqual([]);
  });

  it('recommendation service exists', () => {
    expect(backendModuleExists('services/recommendation.service.ts')).toBe(true);
    expect(backendModuleExists('prompts/room-recommendation.ts')).toBe(true);
  });

  it('API router mounts /ai', () => {
    const index = fs.readFileSync(
      path.resolve(__dirname, '../../../src/routes/index.ts'),
      'utf8',
    );
    expect(/['"]\/ai['"]/.test(index)).toBe(true);
  });
});
