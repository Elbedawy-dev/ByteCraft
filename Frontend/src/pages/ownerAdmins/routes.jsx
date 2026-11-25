import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const OwnerAdminsPage = lazy(() => import('./OwnerAdminsPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_ADMINS,
      element: <OwnerAdminsPage />,
    },
  ],
};
