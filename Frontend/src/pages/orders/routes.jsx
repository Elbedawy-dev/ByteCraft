import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const OrderTrackingPage = lazy(() => import('./OrderTrackingPage'));
const PaymentResultPage = lazy(() => import('./PaymentResultPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.ORDER_TRACKING,
      element: <OrderTrackingPage />,
    },
    {
      path: ROUTES.PAYMENT_RESULT,
      element: <PaymentResultPage />,
    },
  ],
};
