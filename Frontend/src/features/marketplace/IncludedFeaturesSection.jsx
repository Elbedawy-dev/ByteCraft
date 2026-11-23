import React from 'react';
import { useTranslation } from 'react-i18next';

const FEATURE_ITEMS = [
  {
    key: 'sourceCode',
    icon: 'terminal',
    colorClass: 'bc-chip-mint',
  },
  {
    key: 'schemas',
    icon: 'database',
    colorClass: 'bc-chip-sky',
  },
  {
    key: 'apiDocs',
    icon: 'api',
    colorClass: 'bc-chip-violet',
  },
  {
    key: 'deployment',
    icon: 'support_agent',
    colorClass: 'bc-chip-amber',
  },
];

export function IncludedFeaturesSection() {
  const { t } = useTranslation('marketplace');

  return (
    <section
      aria-labelledby="included-features-heading"
      className="space-y-space-lg pt-space-md border-t border-outline-variant"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-xs">
        <div className="space-y-1 min-w-0">
          <h2
            id="included-features-heading"
            className="font-headline-lg text-headline-xl-mobile sm:text-headline-lg font-bold text-on-surface"
          >
            {t('included.title')}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t('included.subtitle')}
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-full font-label-code text-label-code bg-badge-green-bg border border-primary/25 text-badge-green-text shrink-0 self-start">
          <bdi dir="ltr">{t('included.badge')}</bdi>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {FEATURE_ITEMS.map(({ key, icon, colorClass }) => (
          <article
            key={key}
            className="bg-card border border-card-border shadow-card p-5 rounded-xl flex flex-col gap-3 h-full"
          >
            <div
              className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <h3 className="font-headline-md text-base sm:text-body-lg font-bold text-on-surface leading-snug">
              {t(`included.items.${key}.title`)}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {t(`included.items.${key}.description`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
