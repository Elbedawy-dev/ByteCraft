import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerCouponsPage = lazy(() => import('./OwnerCouponsPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_COUPONS,
      element: <OwnerCouponsPage />,
    },
  ],
};
