import { useContext } from 'react';
import { OwnerSessionContext } from './OwnerSessionContext';

/**
 * Returns the authenticated owner session state and actions:
 * { owner, isLoading, isAuthenticated, isError, error, refetch, logout, isLoggingOut }
 */
export function useOwner() {
  const context = useContext(OwnerSessionContext);
  if (!context) {
    throw new Error('useOwner must be used within an OwnerSessionProvider');
  }
  return context;
}
