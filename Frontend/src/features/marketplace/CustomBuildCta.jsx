import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui';

export function CustomBuildCta() {
  const { t } = useTranslation('marketplace');

  return (
    <section
      aria-labelledby="custom-build-cta-heading"
      className="bg-card border border-card-border rounded-2xl p-space-md sm:p-space-lg lg:p-space-xl relative overflow-x-clip overflow-y-hidden shadow-card"
    >
      {/* Subtle Ambient Glow */}
      <div
        className="absolute -bottom-10 -end-10 w-64 h-64 bg-primary/10 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
        <div className="flex items-start gap-space-md max-w-2xl min-w-0">
          <div
            className="w-12 h-12 rounded-xl bg-badge-green-bg border border-primary/20 shrink-0 flex items-center justify-center text-primary"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[28px]">design_services</span>
          </div>

          <div className="space-y-1.5 min-w-0">
            <span className="block font-label-code text-label-code text-primary uppercase">
              <bdi dir="ltr">{t('cta.eyebrow')}</bdi>
            </span>
            <h2
              id="custom-build-cta-heading"
              className="font-headline-lg text-headline-xl-mobile sm:text-headline-lg font-bold text-on-surface"
            >
              {t('cta.title')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {t('cta.description')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <Link to={ROUTES.CONTACT} className="w-full sm:w-auto">
            <Button
              variant="primary-gradient"
              size="md"
              className="w-full sm:w-auto whitespace-nowrap"
              iconLeading={
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
              }
            >
              {t('cta.primaryAction')}
            </Button>
          </Link>

          <Link to={ROUTES.PRICING} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              {t('cta.secondaryAction')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
