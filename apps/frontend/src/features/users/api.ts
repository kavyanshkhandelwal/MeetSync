import { apiClient } from '../../lib/axios';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: string;
  updatedAt: string;
}

interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
}

export const getUsers = async (params?: { search?: string; role?: string }): Promise<User[]> => {
  const response = await apiClient.get('/users', { params });
  return response.data.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data.data;
};

export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await apiClient.post('/users', data);
  return response.data.data;
};

export const updateUser = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateUserData;
}): Promise<User> => {
  const response = await apiClient.patch(`/users/${id}`, data);
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
