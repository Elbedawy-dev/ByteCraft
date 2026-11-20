import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerOrdersPage = lazy(() => import('./OwnerOrdersPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_ORDERS,
      element: <OwnerOrdersPage />,
    },
  ],
};
