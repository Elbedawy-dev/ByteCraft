import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { loginPath } from '../../config/routes';
import { Spinner } from '../../components/ui';

/**
 * Route guard requiring an authenticated user (`customer` or `admin`).
 * Redirects unauthenticated visitors to `/login?redirect=<current path>`.
 */
export function RequireAuth({ children }) {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <Spinner size="lg" className="text-primary mb-3" />
        <p className="text-sm text-on-surface-variant">{t('common.verifyingSession')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={loginPath(target)} replace />;
  }

  return children;
}
