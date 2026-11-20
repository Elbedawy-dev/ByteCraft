import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const OwnerSettingsPage = lazy(() => import('./OwnerSettingsPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_SETTINGS,
      element: <OwnerSettingsPage />,
    },
  ],
};
