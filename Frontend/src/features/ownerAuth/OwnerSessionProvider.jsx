import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOwnerLogout, useOwnerMe } from '../../api/owner/auth';
import { useToast } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { OwnerSessionContext } from './OwnerSessionContext';

export function OwnerSessionProvider({ children }) {
  const { t } = useTranslation('owner');
  const navigate = useNavigate();
  const toast = useToast();

  const {
    data: owner = null,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOwnerMe();

  const logoutMutation = useOwnerLogout();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Even if the session cookie was already cleared/expired, finish local sign-out
    }
    toast.success(t('topbar.logoutSuccess'));
    navigate(ROUTES.OWNER_LOGIN, { replace: true });
  }, [logoutMutation, navigate, t, toast]);

  const value = useMemo(
    () => ({
      owner,
      isLoading,
      isFetching,
      isAuthenticated: Boolean(owner),
      isError,
      error,
      refetch,
      logout,
      isLoggingOut: logoutMutation.isPending,
    }),
    [owner, isLoading, isFetching, isError, error, refetch, logout, logoutMutation.isPending]
  );

  return (
    <OwnerSessionContext.Provider value={value}>
      {children}
    </OwnerSessionContext.Provider>
  );
}
