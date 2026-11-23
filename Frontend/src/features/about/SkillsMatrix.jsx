import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const CATEGORY_ICON_COLORS = {
  primary: 'bc-chip-mint',
  secondary: 'bc-chip-sky',
  tertiary: 'bc-chip-violet',
};

const TAG_COLORS = {
  primary: 'text-chip-mint-fg',
  secondary: 'text-chip-sky-fg',
  neutral: 'text-on-surface-variant',
};

export function SkillsMatrix() {
  const { t } = useTranslation('about');
  const rawCategories = t('skills.categories', { returnObjects: true });
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-primary font-code text-label-code uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              memory
            </span>
            <span>{t('skills.eyebrow')}</span>
          </div>
          <h2 className="text-headline-xl-mobile sm:text-headline-xl font-bold text-on-surface">
            {t('skills.title')}
          </h2>
        </div>

        <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">
          {t('skills.subtitle')}
        </p>
      </div>

      {/* 4-Column Skill Category Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat) => {
          const items = Array.isArray(cat.items) ? cat.items : [];
          return (
            <article
              key={cat.id}
              className="bg-card border border-card-border rounded-xl p-6 shadow-card flex flex-col justify-between"
            >
              <div>
                <div
                  className={clsx(
                    'w-12 h-12 rounded-lg border flex items-center justify-center mb-4',
                    CATEGORY_ICON_COLORS[cat.accent] || CATEGORY_ICON_COLORS.primary
                  )}
                >
                  <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                    {cat.icon}
                  </span>
                </div>

                <h3 className="text-headline-md font-bold text-on-surface mb-1">
                  {cat.title}
                </h3>

                <p className="font-code text-label-code text-primary mb-4">
                  <bdi dir="ltr">{cat.subtitle}</bdi>
                </p>

                <ul className="space-y-2.5">
                  {items.map((tech, idx) => (
                    <li
                      key={`${cat.id}-${idx}`}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface border border-card-border"
                    >
                      <span className="text-body-sm font-semibold text-on-surface">
                        <bdi dir="ltr">{tech.name}</bdi>
                      </span>
                      <span
                        className={clsx(
                          'font-code text-label-code shrink-0',
                          TAG_COLORS[tech.accent] || TAG_COLORS.neutral
                        )}
                      >
                        <bdi dir="ltr">{tech.tag}</bdi>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {cat.footer && (
                <div className="mt-5 p-2.5 rounded-lg bg-surface border border-card-border text-center">
                  <span className="font-code text-label-code text-on-surface-variant">
                    <bdi dir="ltr">{cat.footer}</bdi>
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
