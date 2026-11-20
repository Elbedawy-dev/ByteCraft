import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const CheckoutPage = lazy(() => import('./CheckoutPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.CHECKOUT,
      element: <CheckoutPage />,
    },
  ],
};
