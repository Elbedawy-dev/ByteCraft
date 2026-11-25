import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Returns unified authentication state & actions:
 * { user, role, isAuthenticated, isAdmin, isLoading, login, register, logout, refresh }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
