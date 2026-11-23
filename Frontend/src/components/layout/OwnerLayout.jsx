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
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useTheme } from '../../app/providers';
import { OWNER_NAV_ITEMS } from '../../config/ownerNav';
import { ROUTES } from '../../config/routes';
import { useOwnerDashboard } from '../../api/owner/dashboard';
import { getLocal, setLocal } from '../../lib/storage';
import { formatNumber } from '../../lib/format';
import { Button, Drawer, Skeleton } from '../ui';
import { ErrorState } from '../shared';
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
 * Renders inside OwnerLayout's main container and syncs the topbar title.
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
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 pb-5 border-b border-outline-variant/60',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
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
    <div className="min-h-screen bg-background text-on-surface flex">
      <aside
        aria-hidden="true"
        className="hidden lg:flex lg:flex-col w-64 shrink-0 border-e border-outline-variant bg-surface-container-low p-4 gap-6"
      >
        <Skeleton className="h-9 w-36 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton key={idx} className="h-11 w-full rounded-xl" />
          ))}
        </div>
        <div className="mt-auto">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-outline-variant/70 bg-surface/80 px-4 sm:px-6 flex items-center justify-between">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
}) {
  const { t } = useTranslation(['owner', 'common']);

  const badgeByKey = {
    orders: pendingProofs,
    inquiries: newInquiries,
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
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
                  'group relative flex items-center min-h-[44px] rounded-xl text-sm transition-all duration-150 select-none',
                  collapsed ? 'justify-center px-2' : 'justify-between px-3.5 gap-3',
                  isActive
                    ? 'bg-nav-active-bg text-primary border border-chip-mint-border font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'flex items-center min-w-0',
                      collapsed ? 'justify-center' : 'gap-3'
                    )}
                  >
                    <span
                      className={clsx(
                        'material-symbols-outlined text-[20px] shrink-0',
                        isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
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
                        'px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none shrink-0',
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'bg-primary/15 text-primary'
                      )}
                    >
                      {badgeCount > 99 ? '99+' : formatNumber(badgeCount)}
                    </span>
                  )}

                  {badgeCount > 0 && collapsed && (
                    <span
                      className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-low"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Bottom: Back to Storefront + Owner Card */}
      <div className="flex flex-col gap-2.5 pt-4 border-t border-outline-variant/60">
        <Link
          to={ROUTES.HOME}
          onClick={onNavigate}
          title={collapsed ? t('owner:sidebar.backToSite') : undefined}
          className={clsx(
            'flex items-center min-h-[44px] rounded-xl text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors',
            collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
          )}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0" aria-hidden="true">
            storefront
          </span>
          {!collapsed && <span className="truncate">{t('owner:sidebar.backToSite')}</span>}
        </Link>

        {owner && (
          <div
            className={clsx(
              'rounded-xl bg-surface border border-outline-variant p-2.5 flex items-center',
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
                className="w-9 h-9 rounded-full bc-chip-mint border flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              {!collapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-semibold text-on-surface truncate">
                    {owner.name}
                  </span>
                  <span className="text-[11px] font-mono text-on-surface-variant truncate">
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
              className="w-9 h-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">
                logout
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OwnerLayoutShell() {
  const { t } = useTranslation(['owner', 'common']);
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const {
    owner,
    isLoading,
    isError,
    error,
    refetch,
    logout,
    isLoggingOut,
  } = useOwner();

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

  // Close mobile drawer and dropdowns on route changes
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

  // Fetch dashboard counts for the topbar bell & sidebar badges when authenticated
  const { data: dashboardData } = useOwnerDashboard({
    enabled: Boolean(owner),
    staleTime: 30 * 1000,
  });

  const pendingProofs = dashboardData?.totals?.pendingProofs ?? 0;
  const newInquiries = dashboardData?.totals?.newInquiries ?? 0;
  const totalNotifications = pendingProofs + newInquiries;

  // Derive active route title automatically from config/ownerNav.js
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

  // Loading auth session check
  if (isLoading) {
    return <OwnerShellSkeleton />;
  }

  // Unexpected network/server error while verifying session
  if (isError && !error?.isUnauthorized) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <ErrorState
            title={t('owner:session.errorTitle')}
            message={error?.message || t('owner:session.errorDescription')}
            onRetry={refetch}
          />
          <div className="flex justify-center">
            <Link to={ROUTES.OWNER_LOGIN}>
              <Button variant="ghost" size="sm">
                {t('owner:session.goToLogin')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated -> redirect to /owner/login preserving target path
  if (!owner) {
    const targetPath = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`${ROUTES.OWNER_LOGIN}?redirect=${encodeURIComponent(targetPath)}`}
        replace
      />
    );
  }

  return (
    <OwnerPageContext.Provider value={pageContextValue}>
      <div className="min-h-screen bg-background text-on-surface flex">
        {/* Skip to main content link for keyboard users */}
        <a
          href="#owner-main-content"
          className="visually-hidden focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary focus:text-on-primary focus:font-semibold"
        >
          {t('owner:skipToMain')}
        </a>

        {/* Desktop Sidebar */}
        <aside
          className={clsx(
            'hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 bg-section-band border-e border-outline-variant transition-[width] duration-200 z-30',
            sidebarCollapsed ? 'w-20' : 'w-64'
          )}
        >
          {/* Sidebar Brand & Collapse Toggle */}
          <div
            className={clsx(
              'h-16 flex items-center border-b border-outline-variant shrink-0 px-3',
              sidebarCollapsed ? 'justify-center' : 'justify-between gap-2'
            )}
          >
            {!sidebarCollapsed && (
              <Link
                to={ROUTES.OWNER_DASHBOARD}
                className="flex items-center gap-2.5 min-w-0 px-1 group"
              >
                <div className="w-9 h-9 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">terminal</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-base tracking-tight text-on-surface truncate">
                    Byte<span className="text-primary">Craft</span>
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider truncate">
                    {t('owner:consoleBadge')}
                  </span>
                </div>
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
              className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px] rtl:-scale-x-100">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <div className="flex-1 bc-scroll p-3">
            <SidebarNavContent
              collapsed={sidebarCollapsed}
              pendingProofs={pendingProofs}
              newInquiries={newInquiries}
              owner={owner}
              onLogout={logout}
              isLoggingOut={isLoggingOut}
            />
          </div>
        </aside>

        {/* Mobile Off-Canvas Sidebar Drawer */}
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          side="start"
          size="sm"
          className="lg:hidden"
          title={
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-on-surface">
                  Byte<span className="text-primary">Craft</span>
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                  {t('owner:consoleBadge')}
                </span>
              </div>
            </div>
          }
        >
          <SidebarNavContent
            collapsed={false}
            onNavigate={() => setMobileDrawerOpen(false)}
            pendingProofs={pendingProofs}
            newInquiries={newInquiries}
            owner={owner}
            onLogout={logout}
            isLoggingOut={isLoggingOut}
          />
        </Drawer>

        {/* Main Column: Top Bar + Page Container */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 inset-x-0 z-20 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            {/* Start: Mobile Menu Button + Page Title Slot */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-expanded={mobileDrawerOpen}
                aria-label={t('owner:sidebar.openMobileMenu')}
                className="lg:hidden w-11 h-11 min-h-[44px] min-w-[44px] -ms-1.5 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>

              <div className="flex items-center gap-2 min-w-0 text-sm">
                <span className="hidden sm:inline font-medium text-on-surface-variant">
                  {t('owner:topbar.consoleLabel')}
                </span>
                <span
                  className="hidden sm:inline text-outline"
                  aria-hidden="true"
                >
                  /
                </span>
                <span className="font-semibold text-on-surface truncate">
                  {resolvedTitle}
                </span>
              </div>
            </div>

            {/* End: Lang Toggle, Theme Toggle, Notifications Bell, Owner Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Language Segmented Toggle */}
              <div
                className="inline-flex items-center p-0.5 sm:p-1 bg-surface rounded-xl border border-outline-variant select-none"
                role="group"
                aria-label={t('common:nav.language')}
              >
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  aria-pressed={lang === 'ar'}
                  className={clsx(
                    'px-2 sm:px-2.5 py-1 min-h-[32px] text-xs font-bold rounded-lg transition-colors',
                    lang === 'ar'
                      ? 'bg-nav-active-bg text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  AR
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={clsx(
                    'px-2 sm:px-2.5 py-1 min-h-[32px] text-xs font-bold rounded-lg transition-colors',
                    lang === 'en'
                      ? 'bg-nav-active-bg text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  EN
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === 'dark'
                    ? t('common:nav.switchToLight')
                    : t('common:nav.switchToDark')
                }
                className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
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
                  aria-label={
                    totalNotifications > 0
                      ? `${t('owner:topbar.notifications')} (${totalNotifications})`
                      : t('owner:topbar.notifications')
                  }
                  className="relative w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    notifications
                  </span>
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-surface">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <div
                    role="menu"
                    aria-label={t('owner:topbar.notifications')}
                    className="absolute end-0 mt-2 w-72 sm:w-80 rounded-2xl bg-surface border border-outline-variant shadow-card-hover p-1.5 overflow-hidden z-50"
                  >
                    <div className="bc-scroll max-h-[min(360px,calc(100dvh-6rem))] p-1.5">
                      <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-outline-variant/60">
                        <span className="text-sm font-semibold text-on-surface">
                          {t('owner:topbar.notifications')}
                        </span>
                        {totalNotifications > 0 && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-chip-mint-bg text-chip-mint-fg font-semibold">
                            {formatNumber(totalNotifications)}
                          </span>
                        )}
                      </div>

                      {totalNotifications === 0 ? (
                        <div className="py-6 px-3 text-center">
                          <span className="material-symbols-outlined text-[28px] text-primary mb-1.5 block">
                            task_alt
                          </span>
                          <p className="text-sm font-medium text-on-surface">
                            {t('owner:topbar.noNotifications')}
                          </p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
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
                              className="flex items-start gap-3 p-2.5 rounded-xl bg-card hover:bg-surface-container-high border border-card-border transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bc-chip-amber border flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[18px]">
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
                              className="flex items-start gap-3 p-2.5 rounded-xl bg-card hover:bg-surface-container-high border border-card-border transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bc-chip-mint border flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[18px]">
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
                  </div>
                )}
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
                  aria-label={t('owner:topbar.ownerMenu')}
                  className="h-10 min-h-[40px] ps-1.5 pe-2.5 flex items-center gap-2 rounded-xl bg-surface border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bc-chip-mint border flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      person
                    </span>
                  </span>
                  <span className="hidden md:inline text-xs font-semibold text-on-surface max-w-[120px] truncate">
                    {owner.name}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    expand_more
                  </span>
                </button>

                {ownerMenuOpen && (
                  <div
                    role="menu"
                    aria-label={t('owner:topbar.ownerMenu')}
                    className="absolute end-0 mt-2 w-60 rounded-2xl bg-surface border border-outline-variant shadow-card-hover p-1.5 overflow-hidden z-50"
                  >
                    <div className="bc-scroll max-h-[min(360px,calc(100dvh-6rem))] p-0.5">
                      <div className="px-3 py-2.5 mb-1.5 border-b border-outline-variant/60">
                        <p className="text-[11px] text-on-surface-variant">
                          {t('owner:topbar.signedInAs')}
                        </p>
                        <p className="text-sm font-semibold text-on-surface truncate mt-0.5">
                          {owner.name}
                        </p>
                        <p className="text-xs font-mono text-on-surface-variant truncate">
                          <bdi dir="ltr">{owner.email}</bdi>
                        </p>
                      </div>

                      <Link
                        to={ROUTES.OWNER_SETTINGS}
                        role="menuitem"
                        onClick={() => setOwnerMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          settings
                        </span>
                        <span>{t('owner:topbar.settingsLink')}</span>
                      </Link>

                      <Link
                        to={ROUTES.HOME}
                        role="menuitem"
                        onClick={() => setOwnerMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          storefront
                        </span>
                        <span>{t('owner:topbar.publicSiteLink')}</span>
                      </Link>

                      <div className="my-1.5 border-t border-outline-variant/60" />

                      <button
                        type="button"
                        role="menuitem"
                        disabled={isLoggingOut}
                        onClick={() => {
                          setOwnerMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">
                          logout
                        </span>
                        <span>
                          {isLoggingOut
                            ? t('owner:topbar.loggingOut')
                            : t('owner:topbar.logout')}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Consistent Owner Page Container */}
          <main
            id="owner-main-content"
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0"
          >
            <Outlet />
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
