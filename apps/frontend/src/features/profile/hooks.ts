import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    enabled: !!localStorage.getItem('token'),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/auth/me`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      // Update localStorage user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      // Invalidate and refetch current user
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};
