import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const MarketplacePage = lazy(() => import('./MarketplacePage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.PROJECTS,
      element: <MarketplacePage />,
    },
  ],
};
