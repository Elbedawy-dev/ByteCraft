import React, { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import {
  authKeys,
  fetchAuthMe,
  useAuthMe,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from '../../api/auth';
import { registerUnauthorizedHandler } from '../../api/client';
import { setSessionHint } from '../../lib/storage';

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const {
    data: user = null,
    isLoading,
    isFetching,
    isError,
    error,
  } = useAuthMe();

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  const clearSessionState = useCallback(() => {
    setSessionHint(false);
    queryClient.setQueryData(authKeys.me, null);
    queryClient.removeQueries({ queryKey: ['account'] });
    queryClient.removeQueries({ queryKey: ['owner'] });
  }, [queryClient]);

  useEffect(() => {
    return registerUnauthorizedHandler(clearSessionState);
  }, [clearSessionState]);

  const login = useCallback(
    async ({ email, password }) => {
      return loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async ({ name, email, password, phone = '', locale = 'ar' }) => {
      return registerMutation.mutateAsync({ name, email, password, phone, locale });
    },
    [registerMutation]
  );

  const logout = useCallback(
    async ({ onBeforeClear } = {}) => {
      try {
        await logoutMutation.mutateAsync({ onBeforeClear });
      } catch {
        onBeforeClear?.();
        clearSessionState();
      }
    },
    [logoutMutation, clearSessionState]
  );

  const refresh = useCallback(async () => {
    const freshUser = await queryClient.fetchQuery({
      queryKey: authKeys.me,
      queryFn: ({ signal }) => fetchAuthMe({ signal, force: true }),
      staleTime: 0,
    });
    return freshUser ?? null;
  }, [queryClient]);

  const setUser = useCallback(
    (nextUser) => {
      setSessionHint(Boolean(nextUser));
      queryClient.setQueryData(authKeys.me, nextUser ?? null);
    },
    [queryClient]
  );

  const role = user?.role ?? null;
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isAdmin,
      isLoading,
      isFetching,
      isError,
      error,
      login,
      register,
      logout,
      refresh,
      setUser,
      isLoggingOut: logoutMutation.isPending,
    }),
    [
      user,
      role,
      isAuthenticated,
      isAdmin,
      isLoading,
      isFetching,
      isError,
      error,
      login,
      register,
      logout,
      refresh,
      setUser,
      logoutMutation.isPending,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
