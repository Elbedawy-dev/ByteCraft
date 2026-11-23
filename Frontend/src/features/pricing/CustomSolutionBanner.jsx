import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contactPath } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { OwnerAvatar } from '@/features/about/OwnerAvatar';

export function CustomSolutionBanner() {
  const { t } = useTranslation('pricing');
  const { t: tAbout } = useTranslation('about');

  const rawHighlights = t('customBanner.highlights', { returnObjects: true });
  const highlights = Array.isArray(rawHighlights) ? rawHighlights : [];

  return (
    <section className="mb-12 sm:mb-14">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-card-border p-6 sm:p-8 lg:p-10 shadow-card">
        <div
          className="absolute -end-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Start 8 Cols: Custom Engineering Pitch */}
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-badge-green-bg border border-primary/25 text-badge-green-text font-code text-label-code">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                tune
              </span>
              <span>
                <bdi dir="ltr">{t('customBanner.badge')}</bdi>
              </span>
            </div>

            <h2 className="text-headline-lg lg:text-headline-xl font-bold text-on-surface leading-tight">
              {t('customBanner.title')}
            </h2>

            <p className="text-body-md lg:text-body-lg text-on-surface-variant leading-relaxed">
              {t('customBanner.description')}
            </p>

            {highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-on-surface text-body-sm font-medium"
                  >
                    <span
                      className="material-symbols-outlined text-primary text-[18px] shrink-0"
                      aria-hidden="true"
                    >
                      verified
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* End 4 Cols: Consultant Card + CTA */}
          <div className="lg:col-span-4">
            <div className="p-5 sm:p-6 rounded-xl bg-surface border border-card-border shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <OwnerAvatar
                  initials={tAbout('owner.initials', { defaultValue: 'BC' })}
                  alt={t('customBanner.consultantAlt')}
                  variant="circle"
                />
                <div>
                  <div className="text-label-lg text-on-surface font-bold">
                    {t('customBanner.consultantTitle')}
                  </div>
                  <div className="text-body-sm text-primary font-medium">
                    {t('customBanner.consultantSubtitle')}
                  </div>
                </div>
              </div>

              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {t('customBanner.consultantBio')}
              </p>

              <Link to={contactPath({ type: 'custom_mern' })} className="block w-full">
                <Button
                  variant="primary-gradient"
                  size="md"
                  className="w-full h-auto min-h-[48px] py-3 leading-snug text-center font-bold"
                  tabIndex={-1}
                  iconLeading={
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      chat
                    </span>
                  }
                >
                  {t('customBanner.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
