import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const OwnerDashboardPage = lazy(() => import('./OwnerDashboardPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_DASHBOARD,
      element: <OwnerDashboardPage />,
    },
  ],
};
