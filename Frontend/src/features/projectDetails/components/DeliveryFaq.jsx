import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion } from '../../../components/shared/Accordion';

export function DeliveryFaq() {
  const { t } = useTranslation('projectDetails');
  const rawItems = t('faq.items', { returnObjects: true });
  const items = Array.isArray(rawItems) ? rawItems : [];

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="delivery-faq-heading"
      className="space-y-5"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
          <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
            help
          </span>
        </div>
        <h2 id="delivery-faq-heading" className="text-lg sm:text-headline-lg font-bold text-on-surface">
          {t('sections.faqTitle')}
        </h2>
      </div>

      <Accordion items={items} allowMultiple={false} />
    </section>
  );
}
