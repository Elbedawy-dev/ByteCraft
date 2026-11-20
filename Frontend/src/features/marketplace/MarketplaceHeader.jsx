import React from 'react';
import { useTranslation } from 'react-i18next';

const STAT_KEYS = [
  { key: 'platforms', accentClass: 'text-primary' },
  { key: 'cleanCode', accentClass: 'text-secondary' },
  { key: 'delivery', accentClass: 'text-tertiary' },
];

export function MarketplaceHeader() {
  const { t } = useTranslation('marketplace');

  return (
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
      <div className="space-y-3 max-w-3xl min-w-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/60 text-primary font-label-code text-label-code max-w-full">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <bdi dir="ltr" className="truncate">
            {t('header.eyebrow')}
          </bdi>
        </div>

        <h1 className="font-display-lg text-display-lg-mobile sm:text-headline-xl lg:text-display-lg text-on-surface tracking-tight">
          {t('header.title')}
        </h1>

        <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          {t('header.subtitle')}
        </p>
      </div>

      {/* Micro Metric Bento (static marketing copy) */}
      <dl className="grid grid-cols-3 gap-2 bg-surface-container-low border border-outline-variant/60 p-2 rounded-xl shrink-0 w-full lg:w-auto">
        {STAT_KEYS.map(({ key, accentClass }) => (
          <div
            key={key}
            className="px-2 py-2.5 sm:px-4 sm:py-3 bg-surface-container rounded-lg text-center border border-outline-variant/40 min-w-0"
          >
            <dt className="sr-only">{t(`header.stats.${key}.label`)}</dt>
            <dd className="flex flex-col items-center">
              <span
                className={`block font-label-code text-base sm:text-lg font-bold leading-tight ${accentClass}`}
              >
                <bdi dir="ltr">{t(`header.stats.${key}.value`)}</bdi>
              </span>
              <span className="font-body-sm text-[11px] sm:text-body-sm text-on-surface-variant mt-1 leading-tight">
                {t(`header.stats.${key}.label`)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
