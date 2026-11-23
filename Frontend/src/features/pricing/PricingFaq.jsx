import React from 'react';
import { useTranslation } from 'react-i18next';

export function PricingFaq() {
  const { t } = useTranslation('pricing');
  const rawItems = t('faq.items', { returnObjects: true });
  const items = Array.isArray(rawItems) ? rawItems : [];

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pricing-faq-heading" className="max-w-4xl mx-auto mb-12 sm:mb-14">
      <div className="text-center mb-8">
        <span className="font-code text-label-code text-primary uppercase tracking-wider">
          <bdi dir="ltr">{t('faq.eyebrow')}</bdi>
        </span>
        <h2
          id="pricing-faq-heading"
          className="text-headline-lg sm:text-headline-xl text-on-surface font-bold mt-1.5"
        >
          {t('faq.title')}
        </h2>
        <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
          {t('faq.subtitle')}
        </p>
      </div>

      {/* Native <details> non-exclusive accordion per modern-web-guidance: accordion */}
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="bc-accordion-item group rounded-xl bg-card border border-card-border overflow-hidden transition-colors hover:bg-card-hover hover:border-card-hover-border shadow-card"
          >
            <summary className="w-full min-h-[56px] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-start cursor-pointer select-none text-on-surface hover:text-primary transition-colors font-semibold text-body-md sm:text-body-lg">
              <span>{item.question}</span>
              <span
                className="material-symbols-outlined text-primary text-[24px] shrink-0 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              >
                expand_more
              </span>
            </summary>

            <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-card-border text-body-md text-on-surface-variant leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
