import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/shared';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

export function SkillsMatrix() {
  const { t } = useTranslation('about');
  const rawCategories = t('skills.categories', { returnObjects: true });
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  return (
    <section className="max-w-container mx-auto px-4 sm:px-6 py-16 lg:py-24 w-full">
      <Reveal className="mb-12">
        <SectionHeader
          align="center"
          badge={t('skills.eyebrow')}
          title={t('skills.title')}
          subtitle={t('skills.subtitle')}
        />
      </Reveal>

      {/* 4-Column Grouped Soft Cards with 48px Gradient Icon Chips */}
      <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const items = Array.isArray(cat.items) ? cat.items : [];
          return (
            <StaggerItem
              as="article"
              key={cat.id}
              className="bg-section-band border border-card-border rounded-xl p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center mb-5">
                  <span className="material-symbols-rounded icon-gradient text-[26px]" aria-hidden="true">
                    {cat.icon}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-on-surface mb-1">
                  {cat.title}
                </h3>

                <p className="font-mono text-xs text-primary mb-5">
                  <bdi dir="ltr">{cat.subtitle}</bdi>
                </p>

                <ul className="space-y-2.5">
                  {items.map((tech, idx) => (
                    <li
                      key={`${cat.id}-${idx}`}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-card border border-card-border"
                    >
                      <span className="text-sm font-semibold text-on-surface">
                        <bdi dir="ltr">{tech.name}</bdi>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-soft-text font-mono text-[11px] font-semibold shrink-0">
                        <bdi dir="ltr">{tech.tag}</bdi>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {cat.footer && (
                <div className="mt-5 p-2.5 rounded-lg bg-card border border-card-border text-center">
                  <span className="font-mono text-xs text-muted">
                    <bdi dir="ltr">{cat.footer}</bdi>
                  </span>
                </div>
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
