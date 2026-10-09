import { vi } from 'vitest';

export const apiClientMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

export function resetApiClientMock() {
  apiClientMock.get.mockReset();
  apiClientMock.post.mockReset();
  apiClientMock.put.mockReset();
  apiClientMock.patch.mockReset();
  apiClientMock.delete.mockReset();
}
