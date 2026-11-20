import React from 'react';
import { useTranslation } from 'react-i18next';

const FEATURE_ITEMS = [
  { key: 'sourceCode', icon: 'terminal', colorClass: 'text-primary' },
  { key: 'schemas', icon: 'database', colorClass: 'text-secondary' },
  { key: 'apiDocs', icon: 'api', colorClass: 'text-tertiary' },
  { key: 'deployment', icon: 'support_agent', colorClass: 'text-primary' },
];

export function IncludedFeaturesSection() {
  const { t } = useTranslation('marketplace');

  return (
    <section
      aria-labelledby="included-features-heading"
      className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-space-md sm:p-space-lg lg:p-space-xl space-y-space-lg"
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

        <span className="px-3 py-1.5 rounded-full font-label-code text-label-code bg-surface-container border border-outline-variant/60 text-primary shrink-0 self-start">
          <bdi dir="ltr">{t('included.badge')}</bdi>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {FEATURE_ITEMS.map(({ key, icon, colorClass }) => (
          <article
            key={key}
            className="bg-surface-container border border-outline-variant/50 p-5 rounded-xl flex flex-col gap-3 h-full hover:border-primary/40 transition-colors"
          >
            <div
              className={`w-11 h-11 rounded-lg bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center shrink-0 ${colorClass}`}
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
