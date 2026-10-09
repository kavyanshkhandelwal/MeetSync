import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClientMock, resetApiClientMock } from '../../mocks/apiClient';

vi.mock('../../../src/lib/axios', () => ({
  apiClient: apiClientMock,
}));

import { getUsers } from '../../../src/features/users/api';

describe('users API module', () => {
  beforeEach(() => {
    resetApiClientMock();
  });

  it('getUsers requests /users with search and role params', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: [] } });
    await getUsers({ search: 'ada', role: 'EMPLOYEE' });
    expect(apiClientMock.get).toHaveBeenCalledWith('/users', {
      params: { search: 'ada', role: 'EMPLOYEE' },
    });
  });
});
