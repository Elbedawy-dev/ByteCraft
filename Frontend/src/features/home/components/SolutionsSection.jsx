import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { SectionHeader } from '@/components/shared';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

const SOLUTION_ITEMS = [
  {
    key: 'lms',
    icon: 'school',
    to: ROUTES.PROJECTS,
  },
  {
    key: 'ecommerce',
    icon: 'shopping_bag',
    to: ROUTES.PROJECTS,
  },
  {
    key: 'custom',
    icon: 'code_blocks',
    to: ROUTES.CONTACT,
  },
  {
    key: 'consulting',
    icon: 'architecture',
    to: ROUTES.PRICING,
  },
];

export function SolutionsSection() {
  const { t } = useTranslation('home');

  return (
    <section
      aria-labelledby="home-solutions-heading"
      className="w-full py-16 lg:py-24"
    >
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <Reveal id="home-solutions-heading" className="mb-12">
          <SectionHeader
            align="center"
            badge={t('solutions.eyebrow')}
            title={t('solutions.title')}
            accent={t('solutions.titleAccent')}
            subtitle={t('solutions.subtitle')}
          />
        </Reveal>

        {/* 4 Service Cards with 48px soft icon chips + 36px circle arrow buttons */}
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SOLUTION_ITEMS.map((item) => {
            const cardTitle = t(`solutions.cards.${item.key}.title`);
            return (
              <StaggerItem key={item.key} className="flex">
                <Link
                  to={item.to}
                  aria-label={cardTitle}
                  className="group bc-card-hover rounded-xl p-6 sm:p-7 flex-1 flex flex-col justify-between gap-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center mb-5">
                      <span
                        className="material-symbols-rounded icon-gradient text-[26px]"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface mb-2.5 group-hover:text-primary transition-colors duration-300 ease-nexus">
                      {cardTitle}
                    </h3>

                    <p className="text-sm text-muted leading-relaxed">
                      {t(`solutions.cards.${item.key}.description`)}
                    </p>
                  </div>

                  {/* 36px circular arrow button */}
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full bg-brand-soft text-primary group-hover:bg-primary-gradient group-hover:text-white transition-all duration-300 ease-nexus flex items-center justify-center shrink-0"
                  >
                    <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100">
                      arrow_forward
                    </span>
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
