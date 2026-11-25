import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const OwnerUsersPage = lazy(() => import('./OwnerUsersPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_USERS,
      element: <OwnerUsersPage />,
    },
  ],
};
