import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../../src');
const FRONTEND = path.resolve(__dirname, '../../../frontend/src');
const BACKEND_PKG = path.resolve(__dirname, '../../package.json');
const FRONTEND_PKG = path.resolve(__dirname, '../../../frontend/package.json');

export const EXPECTED_BACKEND_MODULES = [
  'services/ai.service.ts',
  'services/recommendation.service.ts',
  'controllers/ai.controller.ts',
  'routes/ai.routes.ts',
  'validators/ai.validator.ts',
  'prompts/room-recommendation.ts',
];

export function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

export function readPkg(pkgPath: string): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} {
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

export function backendPkg() {
  return readPkg(BACKEND_PKG);
}

export function frontendPkg() {
  return readPkg(FRONTEND_PKG);
}

export function backendSrcMentions(pattern: RegExp): string[] {
  return walk(SRC)
    .filter((f) => f.endsWith('.ts'))
    .filter((f) => pattern.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(SRC, f).replace(/\\/g, '/'));
}

export function frontendSrcMentions(pattern: RegExp): string[] {
  return walk(FRONTEND)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => pattern.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(FRONTEND, f).replace(/\\/g, '/'));
}

export function backendModuleExists(rel: string): boolean {
  return fs.existsSync(path.join(SRC, rel));
}

export async function tryImportBackend(rel: string): Promise<unknown | null> {
  const full = path.join(SRC, rel);
  if (!fs.existsSync(full)) return null;
  try {
    return await import(full);
  } catch {
    return null;
  }
}

export const AI_DEP_NAMES = [
  'openai',
  '@anthropic-ai/sdk',
  '@google/generative-ai',
  'langchain',
  '@langchain/core',
  'ai',
];

export const FORBIDDEN_BACKEND_AI_DEPS = AI_DEP_NAMES.filter((name) => name !== 'openai');
