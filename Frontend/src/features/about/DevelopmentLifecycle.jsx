import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';

const STEP_BADGE_STYLES = {
  primary: 'bc-chip-mint',
  secondary: 'bc-chip-sky',
  tertiary: 'bc-chip-violet',
};

const STEP_TEXT_COLORS = {
  primary: 'text-chip-mint-fg',
  secondary: 'text-chip-sky-fg',
  tertiary: 'text-chip-violet-fg',
};

export function DevelopmentLifecycle() {
  const { t } = useTranslation('about');
  const rawSteps = t('lifecycle.steps', { returnObjects: true });
  const steps = Array.isArray(rawSteps) ? rawSteps : [];

  return (
    <section className="w-full bg-section-band border-t border-outline-variant py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-badge-green-bg border border-primary/25 text-badge-green-text font-code text-label-code mb-3">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              cycle
            </span>
            <span>{t('lifecycle.eyebrow')}</span>
          </span>

          <h2 className="text-headline-xl-mobile sm:text-headline-xl font-bold text-on-surface">
            {t('lifecycle.title')}
          </h2>

          <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
            {t('lifecycle.subtitle')}
          </p>
        </div>

        {/* 4 Milestone Process Cards Grid */}
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0">
          {steps.map((step) => (
            <li
              key={step.number}
              className="bg-card border border-card-border rounded-xl p-6 shadow-card flex flex-col justify-between transition-all duration-200 hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={clsx(
                      'w-10 h-10 rounded-lg border flex items-center justify-center font-code text-headline-md font-bold',
                      STEP_BADGE_STYLES[step.accent] || STEP_BADGE_STYLES.primary
                    )}
                  >
                    <bdi dir="ltr">{step.number}</bdi>
                  </span>
                  <span
                    className={clsx(
                      'material-symbols-outlined text-[28px]',
                      STEP_TEXT_COLORS[step.accent] || STEP_TEXT_COLORS.primary
                    )}
                    aria-hidden="true"
                  >
                    {step.icon}
                  </span>
                </div>

                <h3 className="text-headline-md font-bold text-on-surface mb-2 leading-snug">
                  {step.title}
                </h3>

                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-card-border">
                <span
                  className={clsx(
                    'font-code text-label-code font-semibold flex items-center gap-1.5',
                    STEP_TEXT_COLORS[step.accent] || STEP_TEXT_COLORS.primary
                  )}
                >
                  <span className="material-symbols-outlined text-[16px] shrink-0" aria-hidden="true">
                    check_circle
                  </span>
                  <span>{step.deliverable}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>

        {/* Action Banner */}
        <div className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-2xl bg-card border border-card-border shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-start">
            <h2 className="text-headline-md font-bold text-on-surface">
              {t('cta.title')}
            </h2>
            <p className="text-body-sm sm:text-body-md text-on-surface-variant">
              {t('cta.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto shrink-0">
            <Link to={ROUTES.CONTACT} className="w-full sm:w-auto">
              <Button
                variant="primary-gradient"
                size="md"
                className="w-full sm:w-auto"
                iconTrailing={
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    bolt
                  </span>
                }
              >
                {t('cta.primaryAction')}
              </Button>
            </Link>

            <Link to={ROUTES.PROJECTS} className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
                iconTrailing={
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    inventory_2
                  </span>
                }
              >
                {t('cta.secondaryAction')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
