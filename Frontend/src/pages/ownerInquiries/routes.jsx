import React, { lazy } from 'react';
import { ROUTES } from '@/config/routes';

const OwnerInquiriesPage = lazy(() => import('./OwnerInquiriesPage'));

export default {
  layout: 'owner',
  routes: [
    {
      path: ROUTES.OWNER_INQUIRIES,
      element: <OwnerInquiriesPage />,
    },
  ],
};
