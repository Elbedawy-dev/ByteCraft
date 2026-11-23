import React from 'react';
import { useTranslation } from 'react-i18next';

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
    </header>
  );
}
