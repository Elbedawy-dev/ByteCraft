import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { getSafeRedirectPath, loginPath } from '../../config/routes';

/**
 * Legacy `/owner/login` route redirects to unified `/login`, preserving safe `redirect`.
 */
export default function OwnerLoginPage() {
  const [searchParams] = useSearchParams();
  const safeRedirect = getSafeRedirectPath(searchParams.get('redirect'), null);

  return <Navigate to={loginPath(safeRedirect)} replace />;
}
