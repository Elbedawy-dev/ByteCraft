import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { LayoutGroup, m } from 'framer-motion';
import { ROUTES } from '../../config/routes';
import { MOTION_TRANSITION } from '../../lib/motion';
import { LayoutMotion } from '../../components/ui/Motion';
import { useAuth } from '../auth';

export function AccountNavTabs({ activeTab = 'profile' }) {
  const { t } = useTranslation(['account', 'common']);
  const { isAdmin } = useAuth();

  const tabs = [
    {
      key: 'profile',
      to: ROUTES.ACCOUNT,
      icon: 'manage_accounts',
      label: t('account:nav.profile'),
    },
    {
      key: 'orders',
      to: ROUTES.ACCOUNT_ORDERS,
      icon: 'receipt_long',
      label: t('account:nav.orders'),
    },
  ];

  return (
    <nav
      aria-label={t('account:nav.ariaLabel')}
      className="flex items-center justify-between gap-3 flex-wrap"
    >
      <LayoutMotion>
        <LayoutGroup id="account-nav-tabs">
          <div className="flex items-center gap-2 flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Link
                  key={tab.key}
                  to={tab.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'relative min-h-[44px] px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ease-nexus',
                    isActive
                      ? 'text-white'
                      : 'bg-card border border-card-border text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-brand-soft/40'
                  )}
                >
                  {isActive && (
                    <m.span
                      layoutId="account-nav-pill"
                      transition={MOTION_TRANSITION}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full btn-primary-gradient shadow-sm"
                    />
                  )}
                  <span className="relative z-10 material-symbols-rounded text-[19px]" aria-hidden="true">
                    {tab.icon}
                  </span>
                  <span className="relative z-10">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </LayoutMotion>

      {isAdmin && (
        <Link
          to={ROUTES.OWNER_DASHBOARD}
          className="min-h-[44px] px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm font-semibold bg-brand-soft text-brand-soft-text border border-primary/25 hover:border-primary/50 transition-all duration-300"
        >
          <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
            admin_panel_settings
          </span>
          <span>{t('account:nav.dashboard')}</span>
        </Link>
      )}
    </nav>
  );
}
