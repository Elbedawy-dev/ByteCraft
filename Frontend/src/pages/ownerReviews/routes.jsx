import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerReviewsPage = lazy(() => import('./OwnerReviewsPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_REVIEWS,
      element: <OwnerReviewsPage />,
    },
  ],
};
