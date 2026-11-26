/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { useLang, useTheme, useToast } from '../../app/providers';
import { OWNER_NAV_ITEMS } from '../../config/ownerNav';
import { loginPath, ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { useOwnerDashboard } from '../../api/owner/dashboard';
import { getLocal, setLocal } from '../../lib/storage';
import { formatNumber } from '../../lib/format';
import { MOTION_TRANSITION } from '../../lib/motion';
import { Button, Drawer, Skeleton } from '../ui';
import { AnimatedOutlet, LayoutMotion } from '../ui/Motion';
import { ErrorState } from '../shared';
import { BrandLogo, LogoMark } from '../shared/LogoMark';
import { useAuth } from '../../features/auth';
import {
  OwnerSessionProvider,
  useNoIndexMeta,
  useOwner,
} from '../../features/ownerAuth';

const SIDEBAR_STORAGE_KEY = 'bc_owner_sidebar_collapsed';

const OwnerPageContext = createContext({
  setPageTitle: () => {},
});

/**
 * Allows owner pages to override the topbar page title dynamically.
 */
export function useOwnerPageTitle(title) {
  const { setPageTitle } = useContext(OwnerPageContext);
  useEffect(() => {
    if (!title) return undefined;
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);
}

/**
 * Consistent page header slot shared across all owner console pages.
 */
export function OwnerPageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
}) {
  useOwnerPageTitle(title);

  return (
    <div
      className={clsx(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 pb-5 border-b border-outline-variant',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

function useClickOutside(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isOpen, onClose]);
}

function OwnerShellSkeleton() {
  return (
    <div className="min-h-screen bg-owner-bg text-on-surface flex">
      <aside
        aria-hidden="true"
        className="hidden lg:flex lg:flex-col w-64 shrink-0 border-e border-navy-border bg-navy p-4 gap-6"
      >
        <div className="h-9 w-36 rounded-xl bg-white/10 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-11 w-full rounded-full bg-white/10 animate-pulse" />
          ))}
        </div>
        <div className="mt-auto">
          <div className="h-14 w-full rounded-xl bg-white/10 animate-pulse" />
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-outline-variant bg-surface/90 px-4 sm:px-6 flex items-center justify-between">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-full" />
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-32 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarNavContent({
  collapsed = false,
  onNavigate,
  pendingProofs = 0,
  newInquiries = 0,
  owner,
  onLogout,
  isLoggingOut,
  navGroupId = 'desktop',
}) {
  const { t } = useTranslation(['owner', 'common']);

  const badgeByKey = {
    orders: pendingProofs,
    inquiries: newInquiries,
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      <LayoutMotion>
        <LayoutGroup id={`owner-sidebar-nav-${navGroupId}`}>
          <nav
            className="flex flex-col gap-1.5"
            aria-label={t('owner:navLabel')}
          >
            {OWNER_NAV_ITEMS.map((item) => {
              const badgeCount = badgeByKey[item.key] || 0;
              const label = t(`common:${item.labelKey}`);

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={Boolean(item.end)}
                  onClick={onNavigate}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center min-h-[44px] rounded-full text-sm transition-colors duration-300 ease-nexus select-none',
                      collapsed ? 'justify-center px-2' : 'justify-between px-4 gap-3',
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-navy-text hover:bg-white/10 hover:text-white font-medium'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <m.span
                          layoutId={`owner-nav-active-${navGroupId}`}
                          transition={MOTION_TRANSITION}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full btn-primary-gradient"
                        />
                      )}
                      <span
                        className={clsx(
                          'relative z-10 flex items-center min-w-0',
                          collapsed ? 'justify-center' : 'gap-3'
                        )}
                      >
                        <span
                          className={clsx(
                            'material-symbols-rounded text-[20px] shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-navy-text group-hover:text-white'
                          )}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{label}</span>}
                      </span>

                      {badgeCount > 0 && !collapsed && (
                        <span
                          className={clsx(
                            'relative z-10 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none shrink-0',
                            isActive
                              ? 'bg-white text-[#131F45]'
                              : 'bg-white/12 text-white'
                          )}
                        >
                          {badgeCount > 99 ? '99+' : formatNumber(badgeCount)}
                        </span>
                      )}

                      {badgeCount > 0 && collapsed && (
                        <span
                          className="absolute z-10 top-1.5 end-1.5 w-2.5 h-2.5 rounded-full bg-[#8FD0FF] ring-2 ring-navy"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </LayoutGroup>
      </LayoutMotion>

      {/* Sidebar Bottom: Back to Storefront + Owner Card */}
      <div className="flex flex-col gap-3 pt-4 border-t border-navy-border">
        <Link
          to={ROUTES.HOME}
          onClick={onNavigate}
          title={collapsed ? t('owner:sidebar.backToSite') : undefined}
          className={clsx(
            'flex items-center min-h-[44px] rounded-full text-sm font-medium text-navy-text hover:text-white hover:bg-white/10 transition-colors duration-300',
            collapsed ? 'justify-center px-2' : 'gap-3 px-4'
          )}
        >
          <span className="material-symbols-rounded text-[20px] shrink-0" aria-hidden="true">
            storefront
          </span>
          {!collapsed && <span className="truncate">{t('owner:sidebar.backToSite')}</span>}
        </Link>

        {owner && (
          <div
            className={clsx(
              'rounded-xl bg-white/[0.07] border border-white/10 p-2.5 flex items-center',
              collapsed ? 'flex-col gap-2' : 'justify-between gap-2'
            )}
          >
            <div
              className={clsx(
                'flex items-center min-w-0',
                collapsed ? 'justify-center' : 'gap-2.5'
              )}
            >
              <div
                className="w-9 h-9 rounded-full bg-primary-gradient flex items-center justify-center text-white shrink-0"
                aria-hidden="true"
              >
                <span className="material-symbols-rounded text-[18px]">person</span>
              </div>
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-white truncate">
                    {owner.name}
                  </span>
                  <span className="text-[11px] font-mono text-navy-text truncate">
                    <bdi dir="ltr">{owner.email}</bdi>
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              title={t('owner:topbar.logout')}
              aria-label={t('owner:topbar.logout')}
              className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-navy-text hover:text-red-300 hover:bg-red-500/20 transition-colors shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
                logout
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerForbiddenPage() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="min-h-screen bc-hero-wash text-on-surface flex flex-col items-center justify-center px-4 py-12 sm:px-6 relative overflow-hidden">
      <div className="w-full max-w-md flex flex-col items-center gap-5 relative z-10 text-center">
        <Link to={ROUTES.HOME} aria-label={`${BRAND.name} Home`}>
          <BrandLogo tone="auto" size="lg" />
        </Link>

        <main className="w-full bg-card border border-card-border rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden space-y-5">
          <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-primary-gradient" />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-chip-danger-bg text-chip-danger-fg border border-chip-danger-border flex items-center justify-center">
            <span className="material-symbols-rounded text-[30px]" aria-hidden="true">
              gpp_bad
            </span>
          </div>

          <div className="space-y-2">
            <span className="inline-flex px-3 py-1 rounded-full bg-chip-danger-bg text-chip-danger-fg text-xs font-mono font-bold">
              403
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              {t('auth:forbidden.title')}
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t('auth:forbidden.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Button
              to={ROUTES.ACCOUNT}
              variant="primary-gradient"
              size="md"
              className="w-full sm:w-auto"
            >
                {t('auth:forbidden.goToAccount')}
              </Button>
            <Button
              to={ROUTES.HOME}
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
            >
                {t('common:actions.backHome')}
              </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

function OwnerLayoutShell() {
  const { t } = useTranslation(['owner', 'common', 'auth']);
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAuthenticated: isAnyAuthenticated,
    isAdmin,
    isLoading,
    isError,
    error,
    refresh,
    logout,
    isLoggingOut,
  } = useAuth();
  const { owner } = useOwner();

  const handleLogout = useCallback(async () => {
    await logout({
      onBeforeClear: () => navigate(ROUTES.LOGIN, { replace: true }),
    });
    toast.success(t('owner:topbar.logoutSuccess'));
  }, [logout, navigate, t, toast]);

  useNoIndexMeta();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => getLocal(SIDEBAR_STORAGE_KEY, 'false') === 'true'
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [customPageTitle, setCustomPageTitle] = useState(null);

  const notifMenuRef = useRef(null);
  const ownerMenuRef = useRef(null);

  useClickOutside(notifMenuRef, notifMenuOpen, () => setNotifMenuOpen(false));
  useClickOutside(ownerMenuRef, ownerMenuOpen, () => setOwnerMenuOpen(false));

  useEffect(() => {
    setMobileDrawerOpen(false);
    setNotifMenuOpen(false);
    setOwnerMenuOpen(false);
  }, [location.pathname, location.search]);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      setLocal(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const { data: dashboardData, error: dashboardError } = useOwnerDashboard({
    enabled: Boolean(isAdmin),
    staleTime: 30 * 1000,
  });

  const pendingProofs = dashboardData?.totals?.pendingProofs ?? 0;
  const newInquiries = dashboardData?.totals?.newInquiries ?? 0;
  const totalNotifications = pendingProofs + newInquiries;

  const activeNavItem = useMemo(() => {
    return OWNER_NAV_ITEMS.find((item) => {
      if (item.end) return location.pathname === item.to;
      return (
        location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`)
      );
    });
  }, [location.pathname]);

  const resolvedTitle =
    customPageTitle ||
    (activeNavItem ? t(`common:${activeNavItem.labelKey}`) : t('common:titles.ownerDashboard'));

  const pageContextValue = useMemo(
    () => ({
      setPageTitle: setCustomPageTitle,
    }),
    []
  );

  if (isLoading) {
    return <OwnerShellSkeleton />;
  }

  if (isError && !error?.isUnauthorized && !error?.isForbidden) {
    return (
      <div className="min-h-screen bg-owner-bg text-on-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <ErrorState
            title={t('owner:session.errorTitle')}
            message={error?.message || t('owner:session.errorDescription')}
            onRetry={refresh}
          />
          <div className="flex justify-center">
            <Button
              to={ROUTES.LOGIN}
              variant="ghost"
              size="sm"
            >
                {t('owner:session.goToLogin')}
              </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAnyAuthenticated) {
    const targetPath = `${location.pathname}${location.search}`;
    return <Navigate to={loginPath(targetPath)} replace />;
  }

  if (!isAdmin || error?.isForbidden || dashboardError?.isForbidden) {
    return <OwnerForbiddenPage />;
  }

  return (
    <OwnerPageContext.Provider value={pageContextValue}>
      <div className="min-h-screen bg-owner-bg text-on-surface flex">
        {/* Skip to main content link */}
        <a
          href="#owner-main-content"
          className="visually-hidden focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary focus:text-on-primary focus:font-semibold"
        >
          {t('owner:skipToMain')}
        </a>

        {/* Desktop Navy Sidebar */}
        <aside
          className={clsx(
            'hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 bg-navy text-navy-text border-e border-navy-border transition-[width] duration-300 ease-nexus z-30',
            sidebarCollapsed ? 'w-20' : 'w-64'
          )}
        >
          {/* Sidebar Brand & Collapse Toggle */}
          <div
            className={clsx(
              'h-16 flex items-center border-b border-navy-border shrink-0 px-3',
              sidebarCollapsed ? 'justify-center' : 'justify-between gap-2'
            )}
          >
            {!sidebarCollapsed ? (
              <Link
                to={ROUTES.OWNER_DASHBOARD}
                aria-label={`${BRAND.name} Dashboard`}
                className="inline-flex items-center min-w-0 px-1 select-none"
              >
                <BrandLogo tone="light" size="sm" />
              </Link>
            ) : (
              <Link
                to={ROUTES.OWNER_DASHBOARD}
                aria-label={`${BRAND.name} Dashboard`}
                className="sr-only"
              >
                {BRAND.name}
              </Link>
            )}

            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              aria-expanded={!sidebarCollapsed}
              aria-label={
                sidebarCollapsed
                  ? t('owner:sidebar.expand')
                  : t('owner:sidebar.collapse')
              }
              title={
                sidebarCollapsed
                  ? t('owner:sidebar.expand')
                  : t('owner:sidebar.collapse')
              }
              className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-navy-text hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              {sidebarCollapsed ? (
                <LogoMark className="w-7 h-7" />
              ) : (
                <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100" aria-hidden="true">
                  chevron_left
                </span>
              )}
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <div className="flex-1 bc-scroll p-3">
            <SidebarNavContent
              collapsed={sidebarCollapsed}
              pendingProofs={pendingProofs}
              newInquiries={newInquiries}
              owner={owner}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
              navGroupId="desktop"
            />
          </div>
        </aside>

        {/* Mobile Off-Canvas Navy Sidebar Drawer */}
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          side="start"
          size="sm"
          tone="navy"
          className="lg:hidden"
          title={<BrandLogo tone="light" size="sm" />}
        >
          <SidebarNavContent
            collapsed={false}
            onNavigate={() => setMobileDrawerOpen(false)}
            pendingProofs={pendingProofs}
            newInquiries={newInquiries}
            owner={owner}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            navGroupId="mobile"
          />
        </Drawer>

        {/* Main Column: Top Bar + Page Container */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 inset-x-0 z-20 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant transition-[background-color,border-color,box-shadow] duration-300 ease-nexus px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            {/* Start: Mobile Menu Button + Page Title Slot */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-expanded={mobileDrawerOpen}
                aria-label={t('owner:sidebar.openMobileMenu')}
                className="lg:hidden w-11 h-11 min-h-[44px] min-w-[44px] -ms-1.5 flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface hover:text-primary hover:bg-brand-soft transition-colors shrink-0"
              >
                <span className="material-symbols-rounded text-[22px]" aria-hidden="true">menu</span>
              </button>

              <div className="flex items-center gap-2 min-w-0 text-sm">
                <span className="hidden sm:inline font-medium text-muted">
                  {t('owner:topbar.consoleLabel')}
                </span>
                <span
                  className="hidden sm:inline text-outline"
                  aria-hidden="true"
                >
                  /
                </span>
                <span className="font-bold text-on-surface truncate">
                  {resolvedTitle}
                </span>
              </div>
            </div>

            {/* End: Lang Toggle, 44px Theme Toggle, Notifications Bell, Owner Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Language Segmented Pill */}
              <LayoutMotion>
                <LayoutGroup id="owner-lang-toggle">
                  <div
                    className="inline-flex items-center p-1 bg-section-band rounded-full border border-outline-variant select-none"
                    role="group"
                    aria-label={t('common:nav.language')}
                  >
                    {(['ar', 'en']).map((code) => {
                      const active = lang === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setLang(code)}
                          aria-pressed={active}
                          className={clsx(
                            'relative px-2.5 py-1 min-h-[32px] text-xs font-bold rounded-full transition-colors duration-300 ease-nexus',
                            active ? 'text-primary' : 'text-muted hover:text-on-surface'
                          )}
                        >
                          {active && (
                            <m.span
                              layoutId="owner-lang-pill"
                              transition={MOTION_TRANSITION}
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full bg-card shadow-sm"
                            />
                          )}
                          <span className="relative z-10">{code.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </LayoutGroup>
              </LayoutMotion>

              {/* 44px rounded-full Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === 'dark'
                    ? t('common:nav.switchToLight')
                    : t('common:nav.switchToDark')
                }
                className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-brand-soft transition-colors duration-300 ease-nexus"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <m.span
                    key={theme}
                    initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
                    transition={MOTION_TRANSITION}
                    className="material-symbols-rounded text-[20px] block"
                    aria-hidden="true"
                  >
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </m.span>
                </AnimatePresence>
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotifMenuOpen((prev) => !prev);
                    setOwnerMenuOpen(false);
                  }}
                  aria-expanded={notifMenuOpen}
                  aria-haspopup="menu"
                  className="relative w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-brand-soft transition-colors duration-300 ease-nexus"
                >
                  <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                    notifications
                  </span>
                  <span className="sr-only">{t('owner:topbar.notifications')}</span>
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 end-0 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-surface">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifMenuOpen && (
                    <m.div
                      role="menu"
                      aria-label={t('owner:topbar.notifications')}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={MOTION_TRANSITION}
                      style={{ transformOrigin: 'top end' }}
                      className="absolute end-0 mt-2 w-72 sm:w-80 rounded-2xl bg-card border border-card-border shadow-card-hover p-1.5 overflow-hidden z-50"
                    >
                      <div className="bc-scroll max-h-[min(360px,calc(100dvh-6rem))] p-1.5">
                        <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-outline-variant">
                          <span className="text-sm font-bold text-on-surface">
                            {t('owner:topbar.notifications')}
                          </span>
                          {totalNotifications > 0 && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-text font-semibold">
                              {formatNumber(totalNotifications)}
                            </span>
                          )}
                        </div>

                        {totalNotifications === 0 ? (
                          <div className="py-6 px-3 text-center">
                            <span className="material-symbols-rounded icon-gradient text-[28px] mb-1.5 block" aria-hidden="true">
                              task_alt
                            </span>
                            <p className="text-sm font-semibold text-on-surface">
                              {t('owner:topbar.noNotifications')}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              {t('owner:topbar.allCaughtUp')}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {pendingProofs > 0 && (
                              <Link
                                to={`${ROUTES.OWNER_ORDERS}?status=awaiting_review`}
                                role="menuitem"
                                onClick={() => setNotifMenuOpen(false)}
                                className="flex items-start gap-3 p-2.5 rounded-xl bg-section-band hover:bg-brand-soft/60 border border-card-border transition-colors"
                              >
                                <div className="w-9 h-9 rounded-lg bc-chip-amber border flex items-center justify-center shrink-0">
                                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                                    receipt_long
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-on-surface truncate">
                                      {t('owner:topbar.pendingProofs')}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-warning shrink-0">
                                      {formatNumber(pendingProofs)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-on-surface-variant mt-0.5">
                                    {t('owner:topbar.pendingProofsDesc', {
                                      count: pendingProofs,
                                    })}
                                  </p>
                                </div>
                              </Link>
                            )}

                            {newInquiries > 0 && (
                              <Link
                                to={`${ROUTES.OWNER_INQUIRIES}?status=new`}
                                role="menuitem"
                                onClick={() => setNotifMenuOpen(false)}
                                className="flex items-start gap-3 p-2.5 rounded-xl bg-section-band hover:bg-brand-soft/60 border border-card-border transition-colors"
                              >
                                <div className="w-9 h-9 rounded-lg bc-chip-brand border flex items-center justify-center shrink-0">
                                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                                    mark_email_unread
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-on-surface truncate">
                                      {t('owner:topbar.newInquiries')}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-primary shrink-0">
                                      {formatNumber(newInquiries)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-on-surface-variant mt-0.5">
                                    {t('owner:topbar.newInquiriesDesc', {
                                      count: newInquiries,
                                    })}
                                  </p>
                                </div>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Owner Menu Dropdown */}
              <div className="relative" ref={ownerMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setOwnerMenuOpen((prev) => !prev);
                    setNotifMenuOpen(false);
                  }}
                  aria-expanded={ownerMenuOpen}
                  aria-haspopup="menu"
                  className="h-11 min-h-[44px] ps-1.5 pe-3 flex items-center gap-2 rounded-full bg-section-band border border-outline-variant hover:bg-brand-soft transition-colors duration-300 ease-nexus"
                >
                  <span className="w-8 h-8 rounded-full bg-primary-gradient text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                      person
                    </span>
                  </span>
                  <span className="sr-only md:not-sr-only text-xs font-semibold text-on-surface max-w-[120px] truncate">
                    {owner.name}
                  </span>
                  <span className="sr-only"> — {t('owner:topbar.ownerMenu')}</span>
                  <span
                    className={clsx(
                      'material-symbols-rounded text-[16px] text-muted transition-transform duration-300 ease-nexus',
                      ownerMenuOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </button>

                <AnimatePresence>
                  {ownerMenuOpen && (
                    <m.div
                      role="menu"
                      aria-label={t('owner:topbar.ownerMenu')}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={MOTION_TRANSITION}
                      style={{ transformOrigin: 'top end' }}
                      className="absolute end-0 mt-2 w-60 rounded-2xl bg-card border border-card-border shadow-card-hover p-1.5 overflow-hidden z-50"
                    >
                      <div className="bc-scroll max-h-[min(360px,calc(100dvh-6rem))] p-0.5">
                        <div className="px-3 py-2.5 mb-1.5 border-b border-outline-variant">
                          <p className="text-[11px] text-muted">
                            {t('owner:topbar.signedInAs')}
                          </p>
                          <p className="text-sm font-semibold text-on-surface truncate mt-0.5">
                            {owner.name}
                          </p>
                          <p className="text-xs font-mono text-muted truncate">
                            <bdi dir="ltr">{owner.email}</bdi>
                          </p>
                        </div>

                        <Link
                          to={ROUTES.OWNER_SETTINGS}
                          role="menuitem"
                          onClick={() => setOwnerMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm text-on-surface hover:bg-section-band transition-colors"
                        >
                          <span className="material-symbols-rounded text-[18px] text-muted" aria-hidden="true">
                            settings
                          </span>
                          <span>{t('owner:topbar.settingsLink')}</span>
                        </Link>

                        <Link
                          to={ROUTES.ACCOUNT}
                          role="menuitem"
                          onClick={() => setOwnerMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm text-on-surface hover:bg-section-band transition-colors"
                        >
                          <span className="material-symbols-rounded text-[18px] text-muted" aria-hidden="true">
                            manage_accounts
                          </span>
                          <span>{t('common:nav.userMenu.account')}</span>
                        </Link>

                        <Link
                          to={ROUTES.HOME}
                          role="menuitem"
                          onClick={() => setOwnerMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm text-on-surface hover:bg-section-band transition-colors"
                        >
                          <span className="material-symbols-rounded text-[18px] text-muted" aria-hidden="true">
                            storefront
                          </span>
                          <span>{t('owner:topbar.publicSiteLink')}</span>
                        </Link>

                        <div className="my-1.5 border-t border-outline-variant" />

                        <button
                          type="button"
                          role="menuitem"
                          disabled={isLoggingOut}
                          onClick={() => {
                            setOwnerMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
                            logout
                          </span>
                          <span>
                            {isLoggingOut
                              ? t('owner:topbar.loggingOut')
                              : t('owner:topbar.logout')}
                          </span>
                        </button>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Consistent Owner Page Container */}
          <main
            id="owner-main-content"
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 flex flex-col"
          >
            <AnimatedOutlet className="flex-1 flex flex-col" />
          </main>
        </div>
      </div>
    </OwnerPageContext.Provider>
  );
}

export function OwnerLayout() {
  return (
    <OwnerSessionProvider>
      <OwnerLayoutShell />
    </OwnerSessionProvider>
  );
}

export { OwnerSessionProvider, useOwner };
