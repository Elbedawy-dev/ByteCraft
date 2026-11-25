import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/shared';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

const FEATURE_ITEMS = [
  { key: 'sourceCode', icon: 'code_blocks' },
  { key: 'schemas', icon: 'database' },
  { key: 'apiDocs', icon: 'api' },
  { key: 'deployment', icon: 'support_agent' },
];

export function IncludedFeaturesSection() {
  const { t } = useTranslation('marketplace');

  return (
    <section
      aria-labelledby="included-features-heading"
      className="pt-12 border-t border-outline-variant"
    >
      <Reveal id="included-features-heading" className="mb-12">
        <SectionHeader
          align="center"
          badge={t('included.badge')}
          title={t('included.title')}
          subtitle={t('included.subtitle')}
        />
      </Reveal>

      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURE_ITEMS.map(({ key, icon }) => (
          <StaggerItem
            as="article"
            key={key}
            className="bg-card border border-card-border shadow-card p-6 sm:p-7 rounded-xl flex flex-col gap-4 h-full"
          >
            <div
              className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="material-symbols-rounded icon-gradient text-[26px]">{icon}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
              {t(`included.items.${key}.title`)}
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {t(`included.items.${key}.description`)}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
