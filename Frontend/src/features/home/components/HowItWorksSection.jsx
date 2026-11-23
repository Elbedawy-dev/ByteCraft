import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/shared';

const PROCESS_STEPS = [
  {
    key: 'step1',
    icon: 'lightbulb',
    badgeBg: 'bc-chip-mint border',
    tagText: 'text-chip-mint-fg',
  },
  {
    key: 'step2',
    icon: 'palette',
    badgeBg: 'bc-chip-sky border',
    tagText: 'text-chip-sky-fg',
  },
  {
    key: 'step3',
    icon: 'security_update_good',
    badgeBg: 'bc-chip-amber border',
    tagText: 'text-chip-amber-fg',
  },
  {
    key: 'step4',
    icon: 'verified',
    badgeBg: 'bc-chip-violet border',
    tagText: 'text-chip-violet-fg',
  },
];

export function HowItWorksSection() {
  const { t } = useTranslation('home');

  return (
    <section
      aria-labelledby="home-how-it-works-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full"
    >
      <SectionHeader
        align="center"
        badge={
          <div className="inline-flex items-center gap-2 text-primary text-label-md font-bold">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              timeline
            </span>
            <span>{t('howItWorks.eyebrow')}</span>
          </div>
        }
        title={
          <span id="home-how-it-works-heading">
            {t('howItWorks.title')}
          </span>
        }
        subtitle={t('howItWorks.subtitle')}
        className="max-w-2xl mx-auto mb-10"
      />

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PROCESS_STEPS.map((step) => (
          <li
            key={step.key}
            className="rounded-2xl bg-card border border-card-border p-6 shadow-card hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`w-10 h-10 rounded-full ${step.badgeBg} flex items-center justify-center font-mono text-base font-extrabold`}
                >
                  <bdi dir="ltr">{t(`howItWorks.steps.${step.key}.number`)}</bdi>
                </span>
                <span
                  className={`material-symbols-outlined ${step.tagText} text-[24px]`}
                  aria-hidden="true"
                >
                  {step.icon}
                </span>
              </div>

              <h3 className="text-headline-md font-bold text-on-surface mb-2">
                {t(`howItWorks.steps.${step.key}.title`)}
              </h3>

              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {t(`howItWorks.steps.${step.key}.description`)}
              </p>
            </div>

            <div
              className={`mt-5 pt-2 ${step.tagText} font-label-code text-label-code font-semibold flex items-center gap-1`}
            >
              <span>
                {t(`howItWorks.steps.${step.key}.tag`)}
              </span>
              <span
                className="material-symbols-outlined text-[16px] rtl:-scale-x-100"
                aria-hidden="true"
              >
                chevron_right
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
