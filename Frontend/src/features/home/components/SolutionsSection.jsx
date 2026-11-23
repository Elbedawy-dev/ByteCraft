import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { SectionHeader } from '@/components/shared';

const SOLUTION_ITEMS = [
  {
    key: 'lms',
    icon: 'school',
    to: ROUTES.PROJECTS,
    accentText: 'text-chip-mint-fg',
    chipClass: 'bc-chip-mint',
    ctaHover: 'group-hover:text-chip-sky-fg',
  },
  {
    key: 'ecommerce',
    icon: 'shopping_cart_checkout',
    to: ROUTES.PROJECTS,
    accentText: 'text-chip-sky-fg',
    chipClass: 'bc-chip-sky',
    ctaHover: 'group-hover:text-chip-mint-fg',
  },
  {
    key: 'custom',
    icon: 'code_blocks',
    to: ROUTES.CONTACT,
    accentText: 'text-chip-violet-fg',
    chipClass: 'bc-chip-violet',
    ctaHover: 'group-hover:text-chip-mint-fg',
  },
];

export function SolutionsSection() {
  const { t } = useTranslation('home');

  return (
    <section
      aria-labelledby="home-solutions-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <SectionHeader
          align="start"
          badge={
            <div className="inline-flex items-center gap-2 text-primary text-label-md font-bold">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                developer_board
              </span>
              <span>{t('solutions.eyebrow')}</span>
            </div>
          }
          title={
            <span id="home-solutions-heading">{t('solutions.title')}</span>
          }
          className="max-w-2xl"
        />

        <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">
          {t('solutions.subtitle')}
        </p>
      </div>

      {/* 3 Core Engineering Solutions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SOLUTION_ITEMS.map((item, idx) => {
          const features = t(`solutions.cards.${item.key}.features`, {
            returnObjects: true,
          });
          const featureList = Array.isArray(features) ? features : [];

          return (
            <article
              key={item.key}
              className={`group relative rounded-2xl bg-card border border-card-border p-6 shadow-card hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${
                idx === 2 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center ${item.chipClass} mb-6 group-hover:scale-105 transition-transform duration-200 shadow-sm`}
                >
                  <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
                    {item.icon}
                  </span>
                </div>

                <h3 className="text-headline-md font-bold text-on-surface mb-2">
                  {t(`solutions.cards.${item.key}.title`)}
                </h3>

                <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
                  {t(`solutions.cards.${item.key}.description`)}
                </p>

                <ul className="space-y-2.5 text-body-sm text-on-surface mb-6">
                  {featureList.map((featureText, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span
                        className={`material-symbols-outlined ${item.accentText} text-[18px] shrink-0 mt-0.5`}
                        aria-hidden="true"
                      >
                        check_circle
                      </span>
                      <span>{featureText}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={item.to}
                className={`inline-flex items-center gap-2 min-h-[44px] text-label-lg font-bold ${item.accentText} ${item.ctaHover} transition-colors pt-2 w-fit`}
              >
                <span>{t(`solutions.cards.${item.key}.cta`)}</span>
                <span
                  className="material-symbols-outlined text-[18px] rtl:-scale-x-100 transition-transform duration-200 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
