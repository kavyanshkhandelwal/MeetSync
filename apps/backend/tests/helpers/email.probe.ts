import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../../src');
const PKG = path.resolve(__dirname, '../../package.json');

export const EXPECTED_MODULES = [
  'services/email.service.ts',
  'services/reminder.service.ts',
  'queues/booking.queue.ts',
  'queues/reminder.queue.ts',
  'workers/reminder.worker.ts',
  'workers/email.worker.ts',
  'templates/booking-confirmation.ts',
  'templates/booking-reminder.ts',
];

export function srcFile(relative: string): string {
  return path.join(SRC, relative);
}

export function moduleExists(relative: string): boolean {
  return fs.existsSync(srcFile(relative));
}

export function readBackendPackage(): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  return JSON.parse(fs.readFileSync(PKG, 'utf8'));
}

export function readSrcTree(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(path.relative(SRC, full).replace(/\\/g, '/'));
    }
  };
  walk(SRC);
  return files;
}

export function sourceMentions(pattern: RegExp): string[] {
  return readSrcTree().filter((file) => {
    if (!file.endsWith('.ts')) return false;
    const text = fs.readFileSync(srcFile(file), 'utf8');
    return pattern.test(text);
  });
}

export async function tryImport(relativeFromSrc: string): Promise<unknown | null> {
  const full = srcFile(relativeFromSrc);
  if (!fs.existsSync(full)) return null;
  try {
    return await import(full);
  } catch {
    return null;
  }
}
