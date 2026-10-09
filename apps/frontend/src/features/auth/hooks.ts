import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, getMe, updateProfile } from './api';
import { UpdateProfileInput } from './types';
import { User } from '../../types';
import { connectSocket, disconnectSocket } from '../../lib/socket';

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      connectSocket();
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      connectSocket();
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

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => updateProfile(data),
    onSuccess: (data) => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    disconnectSocket();
    queryClient.invalidateQueries();
    queryClient.clear();
  };

  return { logout };
};
