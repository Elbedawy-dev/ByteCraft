import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';
import { RequireAuth } from '../../features/auth/RequireAuth';

const AccountPage = lazy(() => import('./AccountPage'));
const AccountOrdersPage = lazy(() => import('./AccountOrdersPage'));
const AccountOrderDetailPage = lazy(() => import('./AccountOrderDetailPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.ACCOUNT,
      element: (
        <RequireAuth>
          <AccountPage />
        </RequireAuth>
      ),
    },
    {
      path: ROUTES.ACCOUNT_ORDERS,
      element: (
        <RequireAuth>
          <AccountOrdersPage />
        </RequireAuth>
      ),
    },
    {
      path: ROUTES.ACCOUNT_ORDER_DETAILS,
      element: (
        <RequireAuth>
          <AccountOrderDetailPage />
        </RequireAuth>
      ),
    },
  ],
};
