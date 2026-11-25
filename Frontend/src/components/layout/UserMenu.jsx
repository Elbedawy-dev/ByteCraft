import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import { useToast } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { MOTION_TRANSITION } from '../../lib/motion';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../features/auth';

function getUserInitials(name, email) {
  const cleaned = String(name || '').trim();
  if (cleaned) {
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase();
    }
    return parts[0].slice(0, 2).toLocaleUpperCase();
  }
  const emailPrefix = String(email || '').trim().split('@')[0];
  return (emailPrefix.slice(0, 2) || 'U').toLocaleUpperCase();
}

export function UserMenu() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isAdmin, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const pendingFocusIndexRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleGlobalKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [open]);

  const getMenuItems = () => {
    if (!menuRef.current) return [];
    return Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'));
  };

  useEffect(() => {
    if (!open || pendingFocusIndexRef.current == null) return;
    const items = getMenuItems();
    const targetIdx =
      pendingFocusIndexRef.current === 'last'
        ? items.length - 1
        : Math.min(pendingFocusIndexRef.current, items.length - 1);
    pendingFocusIndexRef.current = null;
    items[targetIdx]?.focus();
  }, [open]);

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (open) {
        getMenuItems()[0]?.focus();
      } else {
        pendingFocusIndexRef.current = 0;
        setOpen(true);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (open) {
        const items = getMenuItems();
        items[items.length - 1]?.focus();
      } else {
        pendingFocusIndexRef.current = 'last';
        setOpen(true);
      }
    }
  };

  const handleMenuKeyDown = (event) => {
    const items = getMenuItems();
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
      items[next]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev =
        currentIndex >= 0
          ? (currentIndex - 1 + items.length) % items.length
          : items.length - 1;
      items[prev]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    const shouldGoHome =
      location.pathname.startsWith(ROUTES.ACCOUNT) ||
      location.pathname.startsWith(ROUTES.OWNER_DASHBOARD);

    await logout({
      onBeforeClear: shouldGoHome
        ? () => navigate(ROUTES.HOME, { replace: true })
        : undefined,
    });
    toast.success(t('nav.userMenu.loggedOutToast'));
  };

  const initials = getUserInitials(user?.name, user?.email);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('nav.userMenu.openMenu')}
        className={clsx(
          'min-h-[44px] ps-1.5 pe-3 py-1 rounded-full bg-section-band border text-sm font-semibold text-on-surface flex items-center gap-2 transition-all duration-300',
          open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-outline-variant hover:border-primary/40 hover:bg-brand-soft/40'
        )}
      >
        <span
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-primary-gradient text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-sm"
        >
          {initials}
        </span>
        <span className="max-w-[110px] truncate">{user?.name}</span>
        <span
          className={clsx(
            'material-symbols-rounded text-[18px] text-muted transition-transform duration-300 ease-nexus',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={t('nav.userMenu.menuLabel')}
            onKeyDown={handleMenuKeyDown}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={MOTION_TRANSITION}
            style={{ transformOrigin: 'top end' }}
            className="absolute end-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-card border border-card-border rounded-2xl shadow-card-hover py-2 z-50"
          >
            {/* User Identity Header */}
            <div className="px-4 py-2.5 border-b border-outline-variant/70 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-on-surface truncate">
                  {user?.name}
                </p>
                {isAdmin && (
                  <Badge variant="primary" size="sm">
                    {t('nav.userMenu.roleAdmin')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted truncate">
                <bdi dir="ltr">{user?.email}</bdi>
              </p>
            </div>

            {/* Links */}
            <div className="py-1.5">
              <Link
                to={ROUTES.ACCOUNT}
                role="menuitem"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-section-band hover:text-primary focus-visible:bg-section-band focus-visible:text-primary focus-visible:outline-none transition-colors"
              >
                <span className="material-symbols-rounded text-[19px] text-on-surface-variant" aria-hidden="true">
                  manage_accounts
                </span>
                <span>{t('nav.userMenu.account')}</span>
              </Link>

              <Link
                to={ROUTES.ACCOUNT_ORDERS}
                role="menuitem"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-section-band hover:text-primary focus-visible:bg-section-band focus-visible:text-primary focus-visible:outline-none transition-colors"
              >
                <span className="material-symbols-rounded text-[19px] text-on-surface-variant" aria-hidden="true">
                  receipt_long
                </span>
                <span>{t('nav.userMenu.orders')}</span>
              </Link>

              {isAdmin && (
                <Link
                  to={ROUTES.OWNER_DASHBOARD}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-brand-soft/60 focus-visible:bg-brand-soft/60 focus-visible:outline-none transition-colors"
                >
                  <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                    dashboard
                  </span>
                  <span>{t('nav.userMenu.dashboard')}</span>
                </Link>
              )}
            </div>

            <div className="my-1 border-t border-outline-variant/70" />

            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/10 focus-visible:bg-error/10 focus-visible:outline-none transition-colors text-start"
            >
              <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                logout
              </span>
              <span>{t('nav.userMenu.logout')}</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
