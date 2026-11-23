import React, { lazy } from 'react';

export default {
  layout: 'public',
  routes: import.meta.env.DEV
    ? [
        {
          path: '/__ui',
          element: React.createElement(lazy(() => import('./UiShowcase'))),
        },
      ]
    : [],
};
