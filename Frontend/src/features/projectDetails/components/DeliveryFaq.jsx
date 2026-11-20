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
      className="p-5 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            help_outline
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
