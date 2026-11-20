import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerCategoriesPage = lazy(() => import('./OwnerCategoriesPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_CATEGORIES,
      element: <OwnerCategoriesPage />,
    },
  ],
};
