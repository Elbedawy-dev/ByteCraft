import React from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { CtaBanner } from '@/components/shared';

export function CustomBuildCta() {
  const { t } = useTranslation('marketplace');

  return (
    <CtaBanner
      badge={t('cta.eyebrow')}
      title={t('cta.title')}
      description={t('cta.description')}
      primaryAction={{
        label: t('cta.primaryAction'),
        to: ROUTES.CONTACT,
        icon: 'arrow_forward',
      }}
      secondaryAction={{
        label: t('cta.secondaryAction'),
        to: ROUTES.PRICING,
      }}
    />
  );
}
