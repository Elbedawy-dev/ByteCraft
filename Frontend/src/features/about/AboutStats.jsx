import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const GLOW_BG = {
  primary: 'bg-primary/10 group-hover:bg-primary/20',
  secondary: 'bg-secondary/10 group-hover:bg-secondary/20',
  tertiary: 'bg-tertiary/10 group-hover:bg-tertiary/20',
};

const ICON_COLOR = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
};

export function AboutStats() {
  const { t } = useTranslation('about');
  const rawStats = t('stats', { returnObjects: true });
  const stats = Array.isArray(rawStats) ? rawStats : [];

  if (stats.length === 0) return null;

  return (
    <section className="w-full py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="group relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/70 p-6 shadow-md transition-all duration-200 hover:bg-surface-container hover:border-outline"
            >
              <div
                className={clsx(
                  'absolute -top-10 -end-10 w-24 h-24 rounded-full blur-xl transition-all pointer-events-none',
                  GLOW_BG[stat.accent] || GLOW_BG.primary
                )}
                aria-hidden="true"
              />

              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={clsx(
                    'material-symbols-outlined text-[28px]',
                    ICON_COLOR[stat.accent] || ICON_COLOR.primary
                  )}
                  aria-hidden="true"
                >
                  {stat.icon}
                </span>
                <span className="font-code text-label-code text-on-surface-variant uppercase tracking-wider">
                  <bdi dir="ltr">{stat.codeLabel}</bdi>
                </span>
              </div>

              <div className="text-display-lg-mobile sm:text-headline-xl lg:text-display-lg font-extrabold tracking-tight text-primary dark:text-transparent dark:bg-clip-text dark:bg-primary-gradient">
                <bdi dir="ltr">{stat.value}</bdi>
              </div>

              <h3 className="text-body-md font-bold text-on-surface mt-2">
                {stat.title}
              </h3>

              <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
