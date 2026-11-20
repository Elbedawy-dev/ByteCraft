import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const HomePage = lazy(() => import('./HomePage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.HOME,
      element: <HomePage />,
    },
  ],
};
