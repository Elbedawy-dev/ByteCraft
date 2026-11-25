import React, { Suspense, useEffect, useRef } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { m } from 'framer-motion';
import { PublicLayout } from '../components/layout/PublicLayout';
import { OwnerLayout } from '../components/layout/OwnerLayout';
import { ErrorBoundary } from './ErrorBoundary';
import { Spinner } from '../components/ui/Spinner';
import { BRAND } from '../config/brand';
import { MOTION_TRANSITION } from '../lib/motion';

function getLayoutBranch(pathname) {
  if (pathname === '/owner/login') return 'raw';
  if (pathname.startsWith('/owner')) return 'owner';
  return 'public';
}

/**
 * ScrollToTop helper: scrolls immediately on cross-layout navigation.
 * Intra-layout transitions scroll smoothly inside AnimatedOutlet.onExitComplete.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const prevBranchRef = useRef(getLayoutBranch(pathname));

  useEffect(() => {
    const nextBranch = getLayoutBranch(pathname);
    if (nextBranch !== prevBranchRef.current || nextBranch === 'raw') {
      window.scrollTo(0, 0);
    }
    prevBranchRef.current = nextBranch;
  }, [pathname]);

  return null;
}

/**
 * Page Suspense fallback (fades in subtly over 300ms so fast lazy loads don't flash)
 */
function PageFallback() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={MOTION_TRANSITION}
      className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh]"
    >
      <Spinner size="lg" className="text-primary mb-3" />
      <span className="text-xs font-medium text-muted animate-pulse">
        {BRAND.name}
      </span>
    </m.div>
  );
}

/**
 * Root Layout wrapper with ErrorBoundary, ScrollToTop, and Suspense
 */
function RootLayout() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Dynamically discover and register all page routes from pages folder
 */
export function buildRoutes() {
  const modules = import.meta.glob('../pages/**/routes.jsx', { eager: true });

  const publicRoutes = [];
  const ownerRoutes = [];
  const rawRoutes = [];

  for (const path in modules) {
    const mod = modules[path];
    const config = mod.default;

    if (!config || !Array.isArray(config.routes)) continue;

    const layout = config.layout || 'public';

    for (const r of config.routes) {
      const routeObject = {
        path: r.path,
        element: (
          <Suspense fallback={<PageFallback />}>
            {r.element}
          </Suspense>
        ),
      };

      if (layout === 'public') {
        publicRoutes.push(routeObject);
      } else if (layout === 'owner') {
        ownerRoutes.push(routeObject);
      } else {
        rawRoutes.push(routeObject);
      }
    }
  }

  // Define top-level structure
  return [
    {
      element: <RootLayout />,
      children: [
        // Public Layout Branch
        {
          element: <PublicLayout />,
          children: publicRoutes,
        },
        // Owner Layout Branch
        {
          element: <OwnerLayout />,
          children: ownerRoutes,
        },
        // Unadorned / None Layout Branch (e.g. /owner/login)
        ...rawRoutes,
      ],
    },
  ];
}

export function AppRouter() {
  const routes = buildRoutes();
  const router = createBrowserRouter(routes);

  return <RouterProvider router={router} />;
}
