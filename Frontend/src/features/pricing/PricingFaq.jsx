import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMeta } from '@/api/meta';
import { useLang } from '@/app/providers';
import { Accordion, SectionHeader } from '@/components/shared';

const PAYMENT_METHOD_KEYS = ['vodafone_cash', 'instapay', 'fawry', 'card'];

export function PricingFaq() {
  const { t } = useTranslation(['pricing', 'common']);
  const { lang } = useLang();
  const { data: meta } = useMeta();

  const paymentMethodsAnswer = useMemo(() => {
    const enabledKeys = PAYMENT_METHOD_KEYS.filter(
      (key) => Boolean(meta?.paymentMethods?.[key]?.enabled)
    );
    if (enabledKeys.length === 0) {
      return t('pricing:faq.paymentMethodsContact');
    }
    const labels = enabledKeys.map((key) =>
      t(`common:paymentMethods.${key}`, { defaultValue: key })
    );
    const separator = lang === 'ar' ? '، ' : ', ';
    return t('pricing:faq.paymentMethodsActive', {
      methods: labels.join(separator),
    });
  }, [meta?.paymentMethods, lang, t]);

  const rawItems = t('pricing:faq.items', { returnObjects: true });
  const items = Array.isArray(rawItems)
    ? rawItems.map((item) => ({
        id: item.id,
        title: item.question,
        content:
          item.id === 'payment-methods' ? paymentMethodsAnswer : item.answer,
      }))
    : [];

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pricing-faq-heading" className="max-w-4xl mx-auto my-14 lg:my-20">
      <div id="pricing-faq-heading" className="mb-12">
        <SectionHeader
          align="center"
          badge={t('pricing:faq.eyebrow')}
          title={t('pricing:faq.title')}
          subtitle={t('pricing:faq.subtitle')}
        />
      </div>

      <Accordion items={items} allowMultiple />
    </section>
  );
}
