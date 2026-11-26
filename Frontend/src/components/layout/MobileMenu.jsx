import React, { useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { useLang, useTheme, useToast } from '../../app/providers';
import { navLinks } from '../../config/nav';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import {
  MOTION_TRANSITION,
  fade,
  getDrawerVariants,
  useAnimatedNativeDialog,
} from '../../lib/motion';
import { BrandLogo } from '../shared/LogoMark';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LayoutMotion } from '../ui/Motion';
import { useAuth } from '../../features/auth';

function getInitials(name, email) {
  const cleaned = String(name || '').trim();
  if (cleaned) {
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase();
    }
    return parts[0].slice(0, 2).toLocaleUpperCase();
  }
  const prefix = String(email || '').trim().split('@')[0];
  return (prefix.slice(0, 2) || 'U').toLocaleUpperCase();
}

export function MobileMenu({ isOpen, onClose }) {
  const { t } = useTranslation('common');
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const drawerVariants = getDrawerVariants('end', dir);
  const {
    dialogRef,
    panelRef,
    handleExitComplete,
    handlePointerDown,
    handlePointerUp,
  } = useAnimatedNativeDialog({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => {
      if (mq.matches) onClose();
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    const shouldGoHome =
      location.pathname.startsWith(ROUTES.ACCOUNT) ||
      location.pathname.startsWith(ROUTES.OWNER_DASHBOARD);

    onClose();
    await logout({
      onBeforeClear: shouldGoHome
        ? () => navigate(ROUTES.HOME, { replace: true })
        : undefined,
    });
    toast.success(t('nav.userMenu.loggedOutToast'));
  };

  return (
    <dialog
      ref={dialogRef}
      data-side="end"
      aria-label={t('nav.mobileMenu', { defaultValue: 'Mobile Navigation' })}
      className="bc-dialog bc-drawer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isOpen && (
          <>
            {/* Backdrop */}
            <m.div
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-overlay backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Full-height Drawer sliding from the end side */}
            <m.div
              ref={panelRef}
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 h-full w-full max-w-xs sm:max-w-sm bg-card border-s border-card-border rounded-s-2xl shadow-card-hover flex flex-col p-6 overflow-hidden"
            >
              {/* Header with BrandLogo + close button */}
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant shrink-0">
                <Link
                  to={ROUTES.HOME}
                  onClick={onClose}
                  aria-label={`${BRAND.name} Home`}
                  className="inline-flex items-center select-none"
                >
                  <BrandLogo tone="auto" size="sm" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-section-band transition-colors duration-300 ease-nexus"
                  aria-label={t('nav.closeMenu', { defaultValue: 'Close menu' })}
                >
                  <span className="material-symbols-rounded text-[22px] block" aria-hidden="true">close</span>
                </button>
              </div>

              {/* Scrollable Middle: Nav Links + Account Summary Links */}
              <div className="flex-1 overflow-y-auto bc-scroll py-4 space-y-5">
                <nav className="flex flex-col gap-1.5" aria-label={t('nav.mobileNavLabel', { defaultValue: 'Mobile navigation' })}>
                  {navLinks.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      end={item.to === ROUTES.HOME}
                      className={({ isActive }) =>
                        clsx(
                          'px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-between',
                          isActive
                            ? 'bg-brand-soft text-brand-soft-text'
                            : 'text-on-surface hover:bg-section-band hover:text-primary'
                        )
                      }
                    >
                      <span>{t(`nav.${item.key}`, { defaultValue: item.defaultLabel })}</span>
                      <span
                        className="material-symbols-rounded text-[18px] text-muted rtl:-scale-x-100"
                        aria-hidden="true"
                      >
                        chevron_right
                      </span>
                    </NavLink>
                  ))}
                </nav>

                {isAuthenticated && user && (
                  <div className="pt-4 border-t border-outline-variant space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-section-band border border-card-border">
                      <span
                        aria-hidden="true"
                        className="w-9 h-9 rounded-full bg-primary-gradient text-white text-xs font-extrabold flex items-center justify-center shrink-0"
                      >
                        {getInitials(user.name, user.email)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-on-surface truncate">
                            {user.name}
                          </p>
                          {isAdmin && (
                            <Badge variant="primary" size="sm">
                              {t('nav.userMenu.roleAdmin')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted truncate">
                          <bdi dir="ltr">{user.email}</bdi>
                        </p>
                      </div>
                    </div>

                    <NavLink
                      to={ROUTES.ACCOUNT}
                      end
                      className={({ isActive }) =>
                        clsx(
                          'px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5',
                          isActive
                            ? 'bg-brand-soft text-brand-soft-text'
                            : 'text-on-surface hover:bg-section-band hover:text-primary'
                        )
                      }
                    >
                      <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                        manage_accounts
                      </span>
                      <span>{t('nav.userMenu.account')}</span>
                    </NavLink>

                    <NavLink
                      to={ROUTES.ACCOUNT_ORDERS}
                      className={({ isActive }) =>
                        clsx(
                          'px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5',
                          isActive
                            ? 'bg-brand-soft text-brand-soft-text'
                            : 'text-on-surface hover:bg-section-band hover:text-primary'
                        )
                      }
                    >
                      <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                        receipt_long
                      </span>
                      <span>{t('nav.userMenu.orders')}</span>
                    </NavLink>

                    {isAdmin && (
                      <NavLink
                        to={ROUTES.OWNER_DASHBOARD}
                        className={({ isActive }) =>
                          clsx(
                            'px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors flex items-center gap-2.5',
                            isActive
                              ? 'bg-brand-soft text-brand-soft-text'
                              : 'text-primary hover:bg-brand-soft/50'
                          )
                        }
                      >
                        <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                          dashboard
                        </span>
                        <span>{t('nav.userMenu.dashboard')}</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom controls: Language, 44px Theme Toggle, Auth / Logout */}
              <div className="pt-4 border-t border-outline-variant space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  {/* Language Segmented Pill */}
                  <LayoutMotion>
                    <LayoutGroup id="mobile-lang-toggle">
                      <div
                        className="inline-flex items-center p-1 bg-section-band rounded-full border border-outline-variant"
                        role="group"
                        aria-label={t('nav.language', { defaultValue: 'Language selection' })}
                      >
                        {[
                          { code: 'ar', label: 'العربية' },
                          { code: 'en', label: 'English' },
                        ].map((opt) => {
                          const active = lang === opt.code;
                          return (
                            <button
                              key={opt.code}
                              type="button"
                              onClick={() => setLang(opt.code)}
                              aria-pressed={active}
                              className={clsx(
                                'relative px-3.5 py-1.5 min-h-[36px] text-xs font-bold rounded-full transition-colors duration-300 ease-nexus',
                                active ? 'text-primary' : 'text-muted hover:text-on-surface'
                              )}
                            >
                              {active && (
                                <m.span
                                  layoutId="mobile-lang-pill"
                                  transition={MOTION_TRANSITION}
                                  aria-hidden="true"
                                  className="absolute inset-0 rounded-full bg-card shadow-sm"
                                />
                              )}
                              <span className="relative z-10">{opt.label}</span>
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
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-brand-soft transition-colors duration-300 ease-nexus"
                    aria-label={
                      theme === 'dark'
                        ? t('nav.switchToLight', { defaultValue: 'Switch to light mode' })
                        : t('nav.switchToDark', { defaultValue: 'Switch to dark mode' })
                    }
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
                </div>

                {isAuthenticated ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    className="w-full"
                    onClick={handleLogout}
                    iconLeading={
                      <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                        logout
                      </span>
                    }
                  >
                    {t('nav.userMenu.logout')}
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      to={ROUTES.LOGIN}
                      onClick={onClose}
                      variant="outline"
                      size="md"
                      className="w-full px-3"
                    >
                        {t('nav.login', { defaultValue: 'Login' })}
                      </Button>
                    <Button
                      to={ROUTES.REGISTER}
                      onClick={onClose}
                      variant="primary-gradient"
                      size="md"
                      className="w-full px-3"
                    >
                        {t('nav.register', { defaultValue: 'Create account' })}
                      </Button>
                  </div>
                )}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}
