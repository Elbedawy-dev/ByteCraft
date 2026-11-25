import React from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { CtaBanner, SectionHeader } from '@/components/shared';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

export function DevelopmentLifecycle() {
  const { t } = useTranslation('about');
  const rawSteps = t('lifecycle.steps', { returnObjects: true });
  const steps = Array.isArray(rawSteps) ? rawSteps : [];

  return (
    <>
      <section className="w-full bg-section-band border-t border-outline-variant py-16 lg:py-24 relative overflow-hidden">
        <div className="max-w-container mx-auto px-4 sm:px-6 relative z-10">
          <Reveal className="mb-12">
            <SectionHeader
              align="center"
              badge={t('lifecycle.eyebrow')}
              title={t('lifecycle.title')}
              subtitle={t('lifecycle.subtitle')}
            />
          </Reveal>

          {/* 4-Step Timeline: Vertical on Mobile, Horizontal on Desktop */}
          <div className="relative">
            {/* Desktop horizontal connector line */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 inset-x-16 h-[2px] bg-primary-gradient opacity-35"
            />

            {/* Mobile vertical connector line */}
            <div
              aria-hidden="true"
              className="lg:hidden absolute top-6 bottom-6 start-6 w-[2px] bg-primary-gradient opacity-35"
            />

            <Stagger as="ol" className="grid grid-cols-1 lg:grid-cols-4 gap-6 list-none p-0 m-0">
              {steps.map((step) => (
                <StaggerItem
                  as="li"
                  key={step.number}
                  className="relative ps-16 lg:ps-0 flex flex-col lg:items-center"
                >
                  {/* Numbered Gradient Circle */}
                  <div className="absolute start-0 top-0 lg:static lg:mb-6 w-12 h-12 rounded-full btn-primary-gradient text-white font-mono font-extrabold text-base flex items-center justify-center ring-4 ring-section-band z-10 shrink-0">
                    <bdi dir="ltr">{step.number}</bdi>
                  </div>

                  {/* Step Card */}
                  <div className="w-full flex-1 bg-card border border-card-border rounded-xl p-6 shadow-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-lg font-bold text-on-surface leading-snug">
                          {step.title}
                        </h3>
                        <span
                          className="material-symbols-rounded icon-gradient text-[24px] shrink-0"
                          aria-hidden="true"
                        >
                          {step.icon}
                        </span>
                      </div>

                      <p className="text-sm text-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-outline-variant">
                      <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <span className="material-symbols-rounded icon-gradient text-[16px] shrink-0" aria-hidden="true">
                          check_circle
                        </span>
                        <span>{step.deliverable}</span>
                      </span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Closing CTA Band */}
      <CtaBanner
        title={t('cta.title')}
        description={t('cta.subtitle')}
        primaryAction={{
          label: t('cta.primaryAction'),
          to: ROUTES.CONTACT,
          icon: 'arrow_forward',
        }}
        secondaryAction={{
          label: t('cta.secondaryAction'),
          to: ROUTES.PROJECTS,
        }}
      />
    </>
  );
}
