import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/shared';

const PILLAR_ITEMS = [
  {
    key: 'speed',
    icon: 'speed',
    accentText: 'text-primary',
  },
  {
    key: 'security',
    icon: 'lock_clock',
    accentText: 'text-secondary',
  },
  {
    key: 'delivery',
    icon: 'electric_bolt',
    accentText: 'text-tertiary',
  },
  {
    key: 'support',
    icon: 'support_agent',
    accentText: 'text-primary-container',
  },
];

export function PillarsSection() {
  const { t } = useTranslation('home');

  return (
    <section
      aria-labelledby="home-pillars-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full"
    >
      <div className="rounded-3xl bg-surface-container border border-outline-variant p-6 sm:p-8 lg:p-10 shadow-xl">
        <SectionHeader
          align="start"
          badge={
            <span className="text-primary text-label-md font-bold uppercase tracking-wider block">
              {t('pillars.eyebrow')}
            </span>
          }
          title={
            <span id="home-pillars-heading">
              {t('pillars.title', { count: t('claims.pillarsCount') })}
            </span>
          }
          subtitle={t('pillars.subtitle')}
          className="max-w-3xl mb-8 lg:mb-10"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {PILLAR_ITEMS.map((pillar) => (
            <article
              key={pillar.key}
              className="flex items-start gap-4 bg-surface-container-low border border-outline-variant/60 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-primary/35 transition-colors duration-200"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center justify-center ${pillar.accentText} shrink-0`}
              >
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  {pillar.icon}
                </span>
              </div>

              <div className="min-w-0">
                <h3 className="text-body-lg font-bold text-on-surface mb-1">
                  {t(`pillars.items.${pillar.key}.title`, {
                    days: t('claims.deliveryDaysRange'),
                  })}
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {t(`pillars.items.${pillar.key}.description`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
