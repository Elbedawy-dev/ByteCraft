import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/app/providers';
import { BRAND } from '@/config/brand';
import { SectionHeader } from '@/components/shared';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

const PILLAR_ITEMS = [
  { key: 'speed', icon: 'rocket_launch' },
  { key: 'security', icon: 'shield_lock' },
  { key: 'delivery', icon: 'bolt' },
  { key: 'support', icon: 'support_agent' },
];

export function PillarsSection() {
  const { t } = useTranslation('home');
  const { lang } = useLang();

  return (
    <section
      aria-labelledby="home-pillars-heading"
      className="relative w-full bg-section-band border-y border-outline-variant overflow-hidden py-16 lg:py-24"
    >
      {/* Subtle reference corner shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -end-16 w-64 h-64 rotate-12 rounded-3xl bg-gradient-to-bl from-[#2B72CF]/10 to-transparent dark:from-[#2B72CF]/12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -start-16 w-64 h-64 -rotate-12 rounded-3xl bg-gradient-to-tr from-[#5443A9]/10 to-transparent dark:from-[#5443A9]/12"
      />

      <div className="relative z-10 max-w-container mx-auto px-4 sm:px-6">
        <Reveal id="home-pillars-heading" className="mb-12">
          <SectionHeader
            align="center"
            badge={t('pillars.eyebrow')}
            title={t('pillars.title')}
            accent={`${BRAND.wordmark}${lang === 'ar' ? '؟' : '?'}`}
            subtitle={t('pillars.subtitle')}
          />
        </Reveal>

        {/* 4 Columns with gradient icons and vertical dividers (no numbers) */}
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-outline-variant">
          {PILLAR_ITEMS.map((pillar) => (
            <StaggerItem
              as="article"
              key={pillar.key}
              className="flex flex-col items-center text-center px-5 py-6 lg:py-3 gap-3.5"
            >
              <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-rounded icon-gradient text-[26px]"
                  aria-hidden="true"
                >
                  {pillar.icon}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-on-surface">
                {t(`pillars.items.${pillar.key}.title`)}
              </h3>

              <p className="text-sm text-muted leading-relaxed max-w-[250px]">
                {t(`pillars.items.${pillar.key}.description`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
