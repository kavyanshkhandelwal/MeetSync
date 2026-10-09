import { describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { makeAdmin, makeUser } from '../../fixtures/users';

describe('user list filtering (controller rules)', () => {
  const users = [
    makeUser({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@company.com', role: Role.EMPLOYEE }),
    makeAdmin({ firstName: 'Grace', lastName: 'Hopper', email: 'grace@company.com' }),
  ];

  function applyControllerFilter(
    list: typeof users,
    search?: string,
    role?: string,
  ) {
    return list
      .map(({ passwordHash, ...user }) => user)
      .filter((user) => {
        let matches = true;
        if (search) {
          const searchLower = search.toLowerCase();
          matches =
            matches &&
            (user.firstName.toLowerCase().includes(searchLower) ||
              user.lastName.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower));
        }
        if (role) {
          matches = matches && user.role === role;
        }
        return matches;
      });
  }

  it('strips passwordHash from every row', () => {
    const result = applyControllerFilter(users);
    expect(result.every((u) => !('passwordHash' in u))).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('filters by case-insensitive name search', () => {
    const result = applyControllerFilter(users, 'ada');
    expect(result.map((u) => u.email)).toEqual(['ada@company.com']);
  });

  it('filters by role', () => {
    const result = applyControllerFilter(users, undefined, Role.ADMIN);
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('grace@company.com');
  });
});
