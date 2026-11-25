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

  // Auth routes (PublicLayout)
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Customer Account routes (PublicLayout, authenticated)
  ACCOUNT: '/account',
  ACCOUNT_ORDERS: '/account/orders',
  ACCOUNT_ORDER_DETAILS: '/account/orders/:orderNumber',

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
  OWNER_USERS: '/owner/users',
  OWNER_ADMINS: '/owner/admins',
  OWNER_SETTINGS: '/owner/settings',

  // Dev-only visual verification route
  DEV_UI: '/__ui',
};

/**
 * Validates `redirect` query params strictly to same-origin relative paths
 * starting with a single `/` (never `//`, `/\`, or absolute URLs).
 */
export function getSafeRedirectPath(rawRedirect, fallback = null) {
  if (typeof rawRedirect !== 'string') return fallback;
  const trimmed = rawRedirect.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
  if (/[\r\n\t]/.test(trimmed)) return fallback;

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(trimmed, base);
    if (parsed.origin !== base) return fallback;
    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!normalized.startsWith('/') || normalized.startsWith('//') || normalized.startsWith('/\\')) {
      return fallback;
    }
    return normalized;
  } catch {
    return fallback;
  }
}

export function loginPath(redirect) {
  const safe = getSafeRedirectPath(redirect, null);
  if (!safe || safe === ROUTES.LOGIN || safe === ROUTES.REGISTER || safe === ROUTES.OWNER_LOGIN) {
    return ROUTES.LOGIN;
  }
  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(safe)}`;
}

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

export function accountOrderDetailsPath(orderNumber) {
  return `/account/orders/${encodeURIComponent(orderNumber)}`;
}

export function contactPath({ plan, project, type } = {}) {
  const params = new URLSearchParams();
  if (plan) params.set('plan', plan);
  if (project) params.set('project', project);
  if (type) params.set('type', type);
  const query = params.toString();
  return query ? `${ROUTES.CONTACT}?${query}` : ROUTES.CONTACT;
}
