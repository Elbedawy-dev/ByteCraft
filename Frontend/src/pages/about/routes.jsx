import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const AboutPage = lazy(() => import('./AboutPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.ABOUT,
      element: <AboutPage />,
    },
  ],
};
