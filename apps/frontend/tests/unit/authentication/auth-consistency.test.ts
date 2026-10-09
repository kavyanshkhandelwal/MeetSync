import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { relativePosix, walkFiles } from '../../helpers/srcTree';

const src = path.resolve(__dirname, '../../../src');

function readSrcFiles(): Array<{ file: string; text: string }> {
  return walkFiles(src)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map((file) => ({ file: relativePosix(src, file), text: fs.readFileSync(file, 'utf8') }));
}

describe('frontend authentication consistency', () => {
  it('does not use the obsolete localStorage token key', () => {
    const hits = readSrcFiles()
      .filter(({ text }) => /localStorage\.(get|set|remove)Item\(\s*['"]token['"]/.test(text))
      .map(({ file }) => file);
    expect(hits).toEqual([]);
  });

  it('does not keep a duplicate profile axios client', () => {
    const profileHooks = path.resolve(src, 'features/profile/hooks.ts');
    expect(fs.existsSync(profileHooks)).toBe(false);
  });

  it('wires Sidebar and UserMenu to useLogout', () => {
    const sidebar = fs.readFileSync(path.join(src, 'components/dashboard/Sidebar.tsx'), 'utf8');
    const userMenu = fs.readFileSync(path.join(src, 'components/layout/user-menu.tsx'), 'utf8');
    expect(sidebar).toContain("from '@/features/auth/hooks'");
    expect(sidebar).toContain('useLogout');
    expect(userMenu).toContain("from '@/features/auth/hooks'");
    expect(userMenu).toContain('useLogout');
    expect(sidebar).not.toMatch(/localStorage\.removeItem\(\s*['"]user['"]\s*\)/);
    expect(userMenu).not.toMatch(/localStorage\.removeItem\(\s*['"]user['"]\s*\)/);
  });

  it('loads and updates profile through the shared auth client', () => {
    const profilePage = fs.readFileSync(path.join(src, 'app/profile/page.tsx'), 'utf8');
    const profileForm = fs.readFileSync(path.join(src, 'components/profile/profile-form.tsx'), 'utf8');
    const registerPage = fs.readFileSync(path.join(src, 'app/register/page.tsx'), 'utf8');
    expect(profilePage).toContain('useCurrentUser');
    expect(profileForm).toContain('useUpdateProfile');
    expect(profileForm).toContain("from '@/features/auth/hooks'");
    expect(registerPage).not.toMatch(/role:\s*z\.enum/);
  });

  it('does not log access tokens from frontend src', () => {
    const hits = readSrcFiles()
      .filter(({ text }) =>
        /Generated Access Token|console\.log\([^)]*accessToken|console\.log\([^)]*authToken/i.test(
          text,
        ),
      )
      .map(({ file }) => file);
    expect(hits).toEqual([]);
  });
});
