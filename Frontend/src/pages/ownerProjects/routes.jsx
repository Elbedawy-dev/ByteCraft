import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerProjectsPage = lazy(() => import('./OwnerProjectsPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_PROJECTS,
      element: <OwnerProjectsPage />,
    },
  ],
};
