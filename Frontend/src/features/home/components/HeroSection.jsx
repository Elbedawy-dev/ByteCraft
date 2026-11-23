import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';

export function HeroSection() {
  const { t } = useTranslation('home');

  return (
    <div className="relative w-full overflow-x-clip bc-hero-wash">
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-space-xl pb-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-space-xl items-center">
          {/* Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start gap-5 sm:gap-6 text-start min-w-0">
            {/* Status Pill */}
            <div className="inline-flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-surface border border-card-border shadow-card max-w-full">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[11px] sm:text-label-md text-primary font-semibold">
                {t('hero.badge.studio')}
              </span>
              <span className="text-on-surface-variant/50 text-[11px] sm:text-body-sm" aria-hidden="true">
                •
              </span>
              <span className="text-[11px] sm:text-label-md text-on-surface-variant">
                {t('hero.badge.region')}
              </span>
            </div>

            {/* Main Headline (display-lg -> mobile variant) */}
            <h1 className="text-display-lg-mobile lg:text-display-lg font-extrabold text-on-surface tracking-tight break-words w-full">
              {t('hero.headlinePrefix')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                {t('hero.headlineHighlight')}
              </span>{' '}
              {t('hero.headlineSuffix')}
            </h1>

            {/* Subtitle */}
            <p className="text-body-md sm:text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 w-full sm:w-auto">
              <Link
                to={ROUTES.PROJECTS}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-3.5 rounded-xl btn-primary-gradient text-label-lg font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>{t('hero.ctaPrimary')}</span>
                <span
                  className="material-symbols-outlined text-[20px] transition-transform duration-200 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:-scale-x-100"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>

              <Link
                to={ROUTES.CONTACT}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3.5 rounded-xl bg-surface border border-input-border text-on-surface text-label-lg font-semibold shadow-card hover:bg-surface-container-high hover:border-outline hover:-translate-y-0.5 hover:text-primary transition-all duration-200"
              >
                <span
                  className="material-symbols-outlined text-[20px] text-primary"
                  aria-hidden="true"
                >
                  terminal
                </span>
                <span>{t('hero.ctaSecondary')}</span>
              </Link>
            </div>
          </div>

          {/* Visual Showcase Column (ONE intentional dark element: #0F172A code window) */}
          <div className="lg:col-span-5 relative min-w-0 pb-2 sm:pb-8">
            <div className="relative rounded-2xl border bc-code-window p-4 sm:p-space-md">
              {/* Terminal Window Bar */}
              <div className="flex items-center justify-between gap-2 mb-3 border bc-code-window-bar px-3 py-2 rounded-lg">
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bc-code-dot-red" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bc-code-dot-yellow" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bc-code-dot-green" />
                </div>
                <bdi
                  dir="ltr"
                  className="font-label-code text-label-code bc-code-muted truncate"
                >
                  {t('hero.terminal.filename')}
                </bdi>
                <span
                  className="material-symbols-outlined bc-code-mint text-[18px] shrink-0"
                  aria-hidden="true"
                >
                  verified
                </span>
              </div>

              {/* Code & Architecture Showcase Preview */}
              <div className="space-y-3">
                {/* Code Block */}
                <div
                  dir="ltr"
                  className="border bc-code-window-body p-3.5 sm:p-4 rounded-xl shadow-inner font-label-code text-[11px] sm:text-label-code leading-relaxed text-start overflow-x-auto"
                >
                  <p className="bc-code-muted">
                    <span className="bc-code-mint font-bold">const</span>{' '}
                    <span className="bc-code-light font-semibold">ByteCraftDeploy</span> ={' '}
                    <span className="bc-code-teal font-bold">async</span> () =&gt; {'{'}
                  </p>
                  <p className="bc-code-light ps-3 sm:ps-4">
                    stack: [<span className="bc-code-mint">&quot;MongoDB&quot;</span>,{' '}
                    <span className="bc-code-teal">&quot;Express&quot;</span>,{' '}
                    <span className="bc-code-sky">&quot;React&quot;</span>,{' '}
                    <span className="bc-code-amber">&quot;Node&quot;</span>],
                  </p>
                  <p className="bc-code-light ps-3 sm:ps-4">
                    payments: [<span className="bc-code-teal">&quot;Vodafone Cash&quot;</span>,{' '}
                    <span className="bc-code-mint">&quot;InstaPay&quot;</span>,{' '}
                    <span className="bc-code-muted">&quot;Cards&quot;</span>],
                  </p>
                  <p className="bc-code-light ps-3 sm:ps-4">
                    architecture:{' '}
                    <span className="bc-code-mint font-bold">&quot;Clean &amp; Modular&quot;</span>,
                  </p>
                  <p className="bc-code-light ps-3 sm:ps-4">
                    caching:{' '}
                    <span className="bc-code-mint font-bold">&quot;Redis Distributed&quot;</span>
                  </p>
                  <p className="bc-code-muted">{'};'}</p>
                </div>
              </div>

              {/* Floating Verified Architecture Badge */}
              <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-6 sm:end-4 bg-surface border border-card-border px-4 py-2.5 rounded-xl shadow-card flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-primary text-[24px] shrink-0"
                  aria-hidden="true"
                >
                  verified_user
                </span>
                <div className="flex flex-col text-start min-w-0">
                  <span className="text-label-lg font-bold text-on-surface leading-tight">
                    {t('hero.terminal.floatingBadgeTitle')}
                  </span>
                  <bdi
                    dir="ltr"
                    className="text-label-md text-on-surface-variant font-mono leading-tight mt-0.5"
                  >
                    {t('hero.terminal.floatingBadgeSubtitle')}
                  </bdi>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
