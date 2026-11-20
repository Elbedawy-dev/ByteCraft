import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';

export function HeroSection() {
  const { t } = useTranslation('home');
  const sparklineGradId = useId();

  const stats = [
    {
      key: 'uptime',
      value: t('claims.uptime'),
      label: t('hero.stats.uptimeLabel'),
      accentClass: 'text-primary',
    },
    {
      key: 'lighthouse',
      value: t('claims.lighthouseScore'),
      label: t('hero.stats.lighthouseLabel'),
      accentClass: 'text-secondary',
    },
    {
      key: 'delivered',
      value: t('claims.deliveredProjects'),
      label: t('hero.stats.deliveredLabel'),
      accentClass: 'text-tertiary',
    },
  ];

  return (
    <div className="relative w-full overflow-x-clip">
      {/* Decorative Ambient Glows */}
      <div
        className="absolute -top-40 end-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-60 start-10 w-80 h-80 bg-secondary-container/10 rounded-full blur-[110px] pointer-events-none"
        aria-hidden="true"
      />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-space-xl pb-12 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-space-xl items-center">
          {/* Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start gap-5 sm:gap-6 text-start min-w-0">
            {/* Status Pill */}
            <div className="inline-flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-surface-container-low border border-outline-variant/60 shadow-sm max-w-full">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-[11px] sm:text-label-md text-primary font-semibold">
                {t('hero.badge.studio')}
              </span>
              <span className="text-outline-variant text-[11px] sm:text-body-sm" aria-hidden="true">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface text-label-lg font-semibold shadow-sm hover:bg-surface-container-high hover:border-primary/40 hover:text-primary transition-all duration-200"
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

            {/* Trust Proof Metrics Row */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full pt-2 sm:pt-3">
              {stats.map((stat) => (
                <div
                  key={stat.key}
                  className="flex flex-col justify-start bg-surface-container-low border border-outline-variant/60 p-3 sm:p-4 rounded-xl shadow-sm min-w-0"
                >
                  <bdi
                    dir="ltr"
                    className={`font-mono text-lg sm:text-headline-lg xl:text-headline-xl font-extrabold tracking-tight leading-tight truncate ${stat.accentClass}`}
                  >
                    {stat.value}
                  </bdi>
                  <span className="text-[11px] sm:text-body-sm text-on-surface-variant leading-snug mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Showcase Column (stacks under text on mobile) */}
          <div className="lg:col-span-5 relative min-w-0 pb-2 sm:pb-8">
            <div className="relative rounded-2xl bg-surface-container border border-outline-variant p-4 sm:p-space-md shadow-2xl">
              {/* Terminal Window Bar */}
              <div className="flex items-center justify-between gap-2 mb-3 bg-surface-container-high border border-outline-variant/60 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-error" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary/70" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-secondary" />
                </div>
                <bdi
                  dir="ltr"
                  className="font-label-code text-label-code text-on-surface-variant truncate"
                >
                  {t('hero.terminal.filename')}
                </bdi>
                <span
                  className="material-symbols-outlined text-primary text-[18px] shrink-0"
                  aria-hidden="true"
                >
                  verified
                </span>
              </div>

              {/* Code & Live Dashboard Preview */}
              <div className="space-y-3">
                {/* Code Block */}
                <div
                  dir="ltr"
                  className="bg-surface-container-lowest border border-outline-variant/60 p-3.5 sm:p-4 rounded-xl shadow-inner font-label-code text-[11px] sm:text-label-code leading-relaxed text-start overflow-x-auto"
                >
                  <p className="text-outline">
                    <span className="text-primary font-bold">const</span>{' '}
                    <span className="text-on-surface font-semibold">ByteCraftDeploy</span> ={' '}
                    <span className="text-secondary font-bold">async</span> () =&gt; {'{'}
                  </p>
                  <p className="text-on-surface ps-3 sm:ps-4">
                    stack: [<span className="text-primary">&quot;MongoDB&quot;</span>,{' '}
                    <span className="text-secondary">&quot;Express&quot;</span>,{' '}
                    <span className="text-tertiary">&quot;React&quot;</span>,{' '}
                    <span className="text-primary-container">&quot;Node&quot;</span>],
                  </p>
                  <p className="text-on-surface ps-3 sm:ps-4">
                    payments: [<span className="text-secondary">&quot;Vodafone Cash&quot;</span>,{' '}
                    <span className="text-primary">&quot;InstaPay&quot;</span>,{' '}
                    <span className="text-on-surface-variant">&quot;Cards&quot;</span>],
                  </p>
                  <p className="text-on-surface ps-3 sm:ps-4">
                    caching:{' '}
                    <span className="text-primary font-bold">&quot;Redis Distributed&quot;</span>,
                  </p>
                  <p className="text-on-surface ps-3 sm:ps-4">
                    latency:{' '}
                    <span className="text-primary font-bold">
                      &quot;{t('claims.ttfbLatency')}&quot;
                    </span>
                  </p>
                  <p className="text-outline">{'};'}</p>
                </div>

                {/* Live Metric Sparkline Card */}
                <div className="bg-surface-container-low border border-outline-variant/60 p-3.5 sm:p-4 sm:pb-11 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="material-symbols-outlined text-primary text-[22px] shrink-0"
                        aria-hidden="true"
                      >
                        rocket_launch
                      </span>
                      <span className="text-body-md font-bold text-on-surface truncate">
                        {t('hero.terminal.metricTitle')}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-label-md font-bold shrink-0">
                      <bdi dir="ltr">{t('claims.conversionLift')}</bdi>
                      <span>{t('hero.terminal.metricBadgeSuffix')}</span>
                    </span>
                  </div>

                  {/* SVG Sparkline Visualization */}
                  <div className="w-full aspect-[5/1] max-h-20 pt-1">
                    <svg
                      className="block w-full h-full overflow-visible"
                      fill="none"
                      viewBox="0 0 300 60"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id={sparklineGradId} x1="0" x2="0" y1="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="rgb(var(--bc-primary))"
                            stopOpacity="0.35"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgb(var(--bc-primary))"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 50 Q 40 45, 75 35 T 150 25 T 225 15 T 300 4"
                        fill="none"
                        stroke="rgb(var(--bc-primary))"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                      <path
                        d="M0 50 Q 40 45, 75 35 T 150 25 T 225 15 T 300 4 L 300 60 L 0 60 Z"
                        fill={`url(#${sparklineGradId})`}
                      />
                      <circle
                        className="animate-pulse"
                        cx="300"
                        cy="4"
                        fill="rgb(var(--bc-primary))"
                        r="5"
                      />
                    </svg>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-on-surface-variant pt-1">
                    <span>
                      {t('hero.terminal.concurrentVisitorsLabel')}:{' '}
                      <bdi dir="ltr" className="font-mono font-semibold text-on-surface">
                        {t('claims.concurrentVisitors')}
                      </bdi>
                    </span>
                    <span className="text-primary font-semibold">
                      {t('hero.terminal.serverResponseLabel')}:{' '}
                      <bdi dir="ltr" className="font-mono">
                        {t('claims.serverResponse')}
                      </bdi>
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Verified Architecture Badge */}
              <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-6 sm:end-4 bg-surface-container-high border border-outline-variant px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3">
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
                    {t('hero.terminal.floatingBadgeSubtitle', {
                      percent: t('claims.cleanArchitecturePercent'),
                    })}
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
