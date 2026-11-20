import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const OwnerLoginPage = lazy(() => import('./OwnerLoginPage'));

export default {
  layout: 'none',
  routes: [
    {
      path: ROUTES.OWNER_LOGIN,
      element: <OwnerLoginPage />,
    },
  ],
};
