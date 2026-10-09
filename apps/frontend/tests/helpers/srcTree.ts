import fs from 'node:fs';
import path from 'node:path';

export function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

export function relativePosix(from: string, file: string): string {
  return path.relative(from, file).replace(/\\/g, '/');
}
