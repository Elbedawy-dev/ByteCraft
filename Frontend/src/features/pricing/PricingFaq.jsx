import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, SectionHeader } from '@/components/shared';

export function PricingFaq() {
  const { t } = useTranslation('pricing');
  const rawItems = t('faq.items', { returnObjects: true });
  const items = Array.isArray(rawItems)
    ? rawItems.map((item) => ({
        id: item.id,
        title: item.question,
        content: item.answer,
      }))
    : [];

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pricing-faq-heading" className="max-w-4xl mx-auto my-14 lg:my-20">
      <div id="pricing-faq-heading" className="mb-12">
        <SectionHeader
          align="center"
          badge={t('faq.eyebrow')}
          title={t('faq.title')}
          subtitle={t('faq.subtitle')}
        />
      </div>

      <Accordion items={items} allowMultiple />
    </section>
  );
}
