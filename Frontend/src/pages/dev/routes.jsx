import React, { lazy } from 'react';

const UiShowcase = lazy(() => import('./UiShowcase'));

export default {
  layout: 'public',
  routes: [
    {
      path: '/__ui',
      element: <UiShowcase />,
    },
  ],
};
