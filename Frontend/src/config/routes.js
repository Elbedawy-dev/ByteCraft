/**
 * Fixed route paths from docs/frontend-contract.md (section 3).
 * All pages and links MUST reference these constants.
 */
export const ROUTES = {
  // Public routes (PublicLayout)
  HOME: '/',
  PROJECTS: '/projects',
  PROJECT_DETAILS: '/projects/:slug',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  CHECKOUT: '/checkout',
  ORDER_TRACKING: '/orders/:orderNumber',
  PAYMENT_RESULT: '/payment/result',

  // Owner routes
  OWNER_LOGIN: '/owner/login',
  OWNER_DASHBOARD: '/owner',
  OWNER_PROJECTS: '/owner/projects',
  OWNER_ORDERS: '/owner/orders',
  OWNER_INQUIRIES: '/owner/inquiries',
  OWNER_REVIEWS: '/owner/reviews',
  OWNER_COUPONS: '/owner/coupons',
  OWNER_CATEGORIES: '/owner/categories',
  OWNER_SERVICE_PLANS: '/owner/service-plans',
  OWNER_SETTINGS: '/owner/settings',

  // Dev-only visual verification route
  DEV_UI: '/__ui',
};

export function projectDetailsPath(slug) {
  return `/projects/${encodeURIComponent(slug)}`;
}

export function checkoutPath({ project, packageKey } = {}) {
  const params = new URLSearchParams();
  if (project) params.set('project', project);
  if (packageKey) params.set('package', packageKey);
  const query = params.toString();
  return query ? `${ROUTES.CHECKOUT}?${query}` : ROUTES.CHECKOUT;
}

export function orderTrackingPath(orderNumber, token) {
  const base = `/orders/${encodeURIComponent(orderNumber)}`;
  if (!token) return base;
  return `${base}?token=${encodeURIComponent(token)}`;
}

export function contactPath({ plan, project, type } = {}) {
  const params = new URLSearchParams();
  if (plan) params.set('plan', plan);
  if (project) params.set('project', project);
  if (type) params.set('type', type);
  const query = params.toString();
  return query ? `${ROUTES.CONTACT}?${query}` : ROUTES.CONTACT;
}
