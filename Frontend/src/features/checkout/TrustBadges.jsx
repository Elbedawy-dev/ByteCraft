import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 3-card trust strip below the checkout submit button.
 * Uses `guaranteeDays` from `/api/meta`.
 */
export function TrustBadges({ guaranteeDays = 30 }) {
  const { t } = useTranslation('checkout');

  const items = [
    {
      key: 'ssl',
      icon: 'lock',
      title: t('trust.sslTitle'),
      subtitle: t('trust.sslSubtitle'),
    },
    {
      key: 'guarantee',
      icon: 'verified_user',
      title: t('trust.guaranteeTitle', { days: guaranteeDays }),
      subtitle: t('trust.guaranteeSubtitle'),
    },
    {
      key: 'cleanCode',
      icon: 'code',
      title: t('trust.cleanCodeTitle'),
      subtitle: t('trust.cleanCodeSubtitle'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-card-border shadow-card"
        >
          <span
            className="material-symbols-outlined text-primary text-[22px] shrink-0"
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-on-surface leading-snug">
              {item.title}
            </span>
            <span className="text-[11px] text-on-surface-variant leading-snug">
              {item.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
