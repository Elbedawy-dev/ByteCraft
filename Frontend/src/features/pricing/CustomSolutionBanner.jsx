import React from 'react';
import { useTranslation } from 'react-i18next';
import { contactPath } from '@/config/routes';
import { CtaBanner } from '@/components/shared';

export function CustomSolutionBanner() {
  const { t } = useTranslation('pricing');
  const rawHighlights = t('customBanner.highlights', { returnObjects: true });
  const highlights = Array.isArray(rawHighlights) ? rawHighlights : [];

  return (
    <CtaBanner
      badge={t('customBanner.badge')}
      title={t('customBanner.title')}
      description={t('customBanner.description')}
      primaryAction={{
        label: t('customBanner.cta'),
        to: contactPath({ type: 'custom_mern' }),
        icon: 'arrow_forward',
      }}
      secondaryAction={{
        label: t('helpStrip.cta'),
        to: contactPath({ type: 'consulting' }),
        icon: 'headset_mic',
      }}
      features={highlights}
    />
  );
}
