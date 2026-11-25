import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { ROUTES } from '@/config/routes';
import { useLang } from '@/app/providers';
import { fade, slideFromEnd } from '@/lib/motion';
import { Button } from '@/components/ui';
import { HeroCubes } from '@/components/shared';

export function HeroSection() {
  const { t } = useTranslation('home');
  const { dir } = useLang();

  return (
    <section className="relative w-full overflow-hidden bc-hero-wash py-16 lg:py-24">
      {/* Translucent reference corner shapes (never over text) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -start-20 w-72 h-72 rotate-12 rounded-3xl bg-gradient-to-br from-[#2B72CF]/10 to-transparent dark:from-[#2B72CF]/12"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -end-16 w-80 h-80 -rotate-12 rounded-3xl bg-gradient-to-tl from-[#5443A9]/10 to-transparent dark:from-[#5443A9]/12"
      />

      <div className="relative z-10 max-w-container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Start Column: Fade-only immediately so LCP text is never delayed */}
          <m.div
            variants={fade}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 xl:col-span-7 flex flex-col items-start gap-5 text-start min-w-0"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-soft text-brand-soft-text border border-chip-mint-border select-none">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
              <span>{t('hero.eyebrow')}</span>
            </span>

            <h1 className="text-display-lg-mobile lg:text-display-lg font-extrabold tracking-tight break-words w-full">
              <span className="block text-on-surface">{t('hero.line1')}</span>
              <span className="block text-brand-gradient mt-1">{t('hero.line2')}</span>
            </h1>

            <p className="text-body-md sm:text-body-lg text-muted max-w-[540px]">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
              <Link to={ROUTES.PROJECTS} className="w-full sm:w-auto">
                <Button
                  variant="primary-gradient"
                  size="lg"
                  className="w-full sm:w-auto"
                  iconTrailing={
                    <span
                      className="material-symbols-rounded text-[19px] rtl:-scale-x-100"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  }
                >
                  {t('hero.ctaPrimary')}
                </Button>
              </Link>

              <Link to={ROUTES.CONTACT} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </m.div>

          {/* End Column: Isometric 3D Cubes slide in from logical end side in 0.3s (static after) */}
          <m.div
            variants={slideFromEnd}
            custom={dir}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 xl:col-span-5 flex items-center justify-center lg:justify-end min-w-0"
          >
            <div className="relative w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[520px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 rounded-full bg-gradient-to-tr from-[#2B72CF]/20 via-[#6A5BDB]/16 to-[#8FD0FF]/20 dark:from-[#2B72CF]/12 dark:via-[#6A5BDB]/12 dark:to-[#5B9BFF]/10 blur-3xl"
              />
              <HeroCubes className="relative w-full h-auto rtl:-scale-x-100 select-none pointer-events-none" />
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
