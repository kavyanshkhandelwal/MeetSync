import { apiClient } from '../../lib/axios';
import { AuthResponse, User } from '../../types';
import { LoginInput, RegisterInput } from './types';

export const login = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data.data;
};

export const register = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data.data;
};
