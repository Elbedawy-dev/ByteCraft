import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../client';

export const ownerAuthKeys = {
  all: ['owner'],
  me: ['owner', 'me'],
};

/**
 * Checks current authenticated owner session via GET /api/owner/me.
 * Returns null on 401 so session probes resolve cleanly without reload loops.
 */
export async function fetchOwnerMe({ signal } = {}) {
  try {
    const { data } = await api.get('/owner/me', {
      signal,
      skipAuthRedirect: true,
    });
    return data?.owner ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      return null;
    }
    throw error;
  }
}

export async function loginOwner({ email, password }) {
  const { data } = await api.post(
    '/owner/login',
    { email, password },
    { skipAuthRedirect: true }
  );
  return data;
}

export async function logoutOwner() {
  const { data } = await api.post('/owner/logout', {}, { skipAuthRedirect: true });
  return data;
}

export async function changeOwnerPassword({ currentPassword, newPassword }) {
  const { data } = await api.patch('/owner/password', {
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
      queryClient.setQueryData(ownerAuthKeys.me, data?.owner ?? null);
      queryClient.invalidateQueries({ queryKey: ownerAuthKeys.me });
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
      queryClient.setQueryData(ownerAuthKeys.me, null);
      queryClient.removeQueries({
        queryKey: ownerAuthKeys.all,
        predicate: (query) => query.queryKey[1] !== 'me',
      });
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
