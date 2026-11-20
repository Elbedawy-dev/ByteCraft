import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerServicePlansPage = lazy(() => import('./OwnerServicePlansPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_SERVICE_PLANS,
      element: <OwnerServicePlansPage />,
    },
  ],
};
