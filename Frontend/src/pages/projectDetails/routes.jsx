import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const ProjectDetailsPage = lazy(() => import('./ProjectDetailsPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.PROJECT_DETAILS,
      element: <ProjectDetailsPage />,
    },
  ],
};
