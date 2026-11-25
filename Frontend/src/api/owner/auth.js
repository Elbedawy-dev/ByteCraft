import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../client';
import {
  authKeys,
  fetchAuthMe,
  loginWithPassword,
  logoutSession,
} from '../auth';

export const ownerAuthKeys = {
  all: ['owner'],
  me: authKeys.me,
};

export async function fetchOwnerMe({ signal } = {}) {
  const user = await fetchAuthMe({ signal });
  return user?.role === 'admin' ? user : null;
}

export async function loginOwner({ email, password }) {
  const user = await loginWithPassword({ email, password });
  return { user, owner: user };
}

export async function logoutOwner() {
  return logoutSession();
}

export async function changeOwnerPassword({ currentPassword, newPassword }) {
  const { data } = await api.patch('/account/password', {
    currentPassword,
    newPassword,
  });
  return data;
}

export function useOwnerMe(options = {}) {
  return useQuery({
    queryKey: ownerAuthKeys.me,
    queryFn: ({ signal }) => fetchOwnerMe({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 1;
    },
    ...options,
  });
}

export function useOwnerLogin(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: loginOwner,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(authKeys.me, data?.user ?? null);
      onSuccess?.(data, variables, context);
    },
    ...restOptions,
  });
}

export function useOwnerLogout(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onSettled, ...restOptions } = options;

  return useMutation({
    mutationFn: logoutOwner,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: ['owner'] });
      queryClient.removeQueries({ queryKey: ['account'] });
      onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      onSettled?.(data, error, variables, context);
    },
    ...restOptions,
  });
}

export function useChangeOwnerPassword(options = {}) {
  return useMutation({
    mutationFn: changeOwnerPassword,
    ...options,
  });
}
