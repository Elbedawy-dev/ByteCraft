import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const ContactPage = lazy(() => import('./ContactPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.CONTACT,
      element: <ContactPage />,
    },
  ],
};
