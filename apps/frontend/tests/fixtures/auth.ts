export const loginInput = {
  email: 'ada@company.com',
  password: 'Secret123',
};

export const authResponse = {
  accessToken: 'test-token',
  user: {
    userId: '11111111-1111-1111-1111-111111111111',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@company.com',
    role: 'EMPLOYEE' as const,
  },
};
