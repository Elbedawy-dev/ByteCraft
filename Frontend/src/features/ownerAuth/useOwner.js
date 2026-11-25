import { useAuth } from '../auth';

/**
 * Thin wrapper over `useAuth()` preserving compatibility for owner console pages.
 * Exposes `owner` only when authenticated user has `role === 'admin'`.
 */
export function useOwner() {
  const auth = useAuth();

  return {
    owner: auth.isAdmin ? auth.user : null,
    user: auth.user,
    role: auth.role,
    isLoading: auth.isLoading,
    isFetching: auth.isFetching,
    isAuthenticated: auth.isAdmin,
    isError: auth.isError,
    error: auth.error,
    refetch: auth.refresh,
    logout: auth.logout,
    isLoggingOut: auth.isLoggingOut,
  };
}
