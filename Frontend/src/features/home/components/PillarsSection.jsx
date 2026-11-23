import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/shared';

const PILLAR_ITEMS = [
  {
    key: 'speed',
    icon: 'speed',
    chipClass: 'bc-chip-mint',
  },
  {
    key: 'security',
    icon: 'lock_clock',
    chipClass: 'bc-chip-sky',
  },
  {
    key: 'delivery',
    icon: 'electric_bolt',
    chipClass: 'bc-chip-amber',
  },
  {
    key: 'support',
    icon: 'support_agent',
    chipClass: 'bc-chip-rose',
  },
];

export function PillarsSection() {
  const { t } = useTranslation('home');

  return (
    <div className="w-full bg-section-band border-y border-outline-variant/70">
      <section
        aria-labelledby="home-pillars-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full"
      >
        <div>
          <SectionHeader
            align="start"
            badge={
              <span className="text-primary text-label-md font-bold uppercase tracking-wider block">
                {t('pillars.eyebrow')}
              </span>
            }
            title={
              <span id="home-pillars-heading">
                {t('pillars.title')}
              </span>
            }
            subtitle={t('pillars.subtitle')}
            className="max-w-3xl mb-8 lg:mb-10"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {PILLAR_ITEMS.map((pillar) => (
              <article
                key={pillar.key}
                className="flex items-start gap-4 bg-card border border-card-border p-5 sm:p-6 rounded-2xl shadow-card hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center ${pillar.chipClass} shrink-0`}
                >
                  <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                    {pillar.icon}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="text-body-lg font-bold text-on-surface mb-1">
                    {t(`pillars.items.${pillar.key}.title`)}
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
    </div>
  );
}
