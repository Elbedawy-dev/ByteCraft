import { ROUTES } from './routes';

/**
 * Owner sidebar navigation items covering every owner route in contract section 3.
 * Icons are Material Symbols Rounded names.
 */
export const OWNER_NAV_ITEMS = [
  {
    key: 'dashboard',
    labelKey: 'ownerNav.dashboard',
    to: ROUTES.OWNER_DASHBOARD,
    icon: 'dashboard',
    end: true,
  },
  {
    key: 'projects',
    labelKey: 'ownerNav.projects',
    to: ROUTES.OWNER_PROJECTS,
    icon: 'deployed_code',
  },
  {
    key: 'orders',
    labelKey: 'ownerNav.orders',
    to: ROUTES.OWNER_ORDERS,
    icon: 'shopping_bag',
  },
  {
    key: 'inquiries',
    labelKey: 'ownerNav.inquiries',
    to: ROUTES.OWNER_INQUIRIES,
    icon: 'mail',
  },
  {
    key: 'reviews',
    labelKey: 'ownerNav.reviews',
    to: ROUTES.OWNER_REVIEWS,
    icon: 'reviews',
  },
  {
    key: 'coupons',
    labelKey: 'ownerNav.coupons',
    to: ROUTES.OWNER_COUPONS,
    icon: 'confirmation_number',
  },
  {
    key: 'categories',
    labelKey: 'ownerNav.categories',
    to: ROUTES.OWNER_CATEGORIES,
    icon: 'category',
  },
  {
    key: 'servicePlans',
    labelKey: 'ownerNav.servicePlans',
    to: ROUTES.OWNER_SERVICE_PLANS,
    icon: 'design_services',
  },
  {
    key: 'users',
    labelKey: 'ownerNav.users',
    to: ROUTES.OWNER_USERS,
    icon: 'group',
  },
  {
    key: 'admins',
    labelKey: 'ownerNav.admins',
    to: ROUTES.OWNER_ADMINS,
    icon: 'admin_panel_settings',
  },
  {
    key: 'settings',
    labelKey: 'ownerNav.settings',
    to: ROUTES.OWNER_SETTINGS,
    icon: 'settings',
  },
];
