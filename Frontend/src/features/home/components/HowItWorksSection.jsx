import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/shared';

const PROCESS_STEPS = [
  {
    key: 'step1',
    icon: 'lightbulb',
    badgeBg: 'bg-primary/15 text-primary',
    tagText: 'text-primary',
  },
  {
    key: 'step2',
    icon: 'palette',
    badgeBg: 'bg-secondary/15 text-secondary',
    tagText: 'text-secondary',
  },
  {
    key: 'step3',
    icon: 'security_update_good',
    badgeBg: 'bg-tertiary/15 text-tertiary',
    tagText: 'text-tertiary',
  },
  {
    key: 'step4',
    icon: 'verified',
    badgeBg: 'bg-primary-container/15 text-primary-container',
    tagText: 'text-primary-container',
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
            {t('howItWorks.title', { count: t('claims.processSteps') })}
          </span>
        }
        subtitle={t('howItWorks.subtitle')}
        className="max-w-2xl mx-auto mb-10"
      />

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PROCESS_STEPS.map((step) => (
          <li
            key={step.key}
            className="rounded-2xl bg-surface-container border border-outline-variant p-6 shadow-md hover:border-primary/35 transition-colors duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`w-10 h-10 rounded-full ${step.badgeBg} flex items-center justify-center font-mono text-base font-extrabold`}
                >
                  <bdi dir="ltr">{t(`howItWorks.steps.${step.key}.number`)}</bdi>
                </span>
                <span
                  className="material-symbols-outlined text-outline text-[24px]"
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
                {t(`howItWorks.steps.${step.key}.tag`, {
                  percent: t('claims.visualMatchPercent'),
                })}
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
