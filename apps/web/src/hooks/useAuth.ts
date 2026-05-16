import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { AuthUser } from '../lib/types';

export function useAuth() {
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<{ user: AuthUser }>('/api/auth/me');
      return response.user;
    },
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      api.post<{ user: AuthUser }>('/api/auth/login', payload),
    onSuccess: (result) => {
      queryClient.setQueryData(['auth', 'me'], result.user);
    }
  });

  const registerMutation = useMutation({
    mutationFn: (payload: {
      organizationName: string;
      name: string;
      email: string;
      password: string;
    }) => api.post<{ user: AuthUser }>('/api/auth/register', payload),
    onSuccess: (result) => {
      queryClient.setQueryData(['auth', 'me'], result.user);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post<void>('/api/auth/logout'),
    onSettled: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }
  });

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: Boolean(meQuery.data),
    loginMutation,
    registerMutation,
    logoutMutation
  };
}
