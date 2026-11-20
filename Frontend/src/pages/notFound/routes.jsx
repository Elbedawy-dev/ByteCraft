import React, { lazy } from 'react';

const NotFound = lazy(() => import('./NotFound'));

export default {
  layout: 'public',
  routes: [
    {
      path: '*',
      element: <NotFound />,
    },
  ],
};
