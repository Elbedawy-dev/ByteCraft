import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const PricingPage = lazy(() => import('./PricingPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.PRICING,
      element: <PricingPage />,
    },
  ],
};
