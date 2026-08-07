import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, getMe } from './api';
import { LoginInput, RegisterInput } from './types';
import { User } from '../../types';

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });
};

export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    queryClient.invalidateQueries();
    queryClient.clear();
  };

  return { logout };
};
