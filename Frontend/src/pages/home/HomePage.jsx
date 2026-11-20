import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { useMeta } from '@/api/meta';
import { CtaBanner } from '@/components/shared';
import {
  HeroSection,
  SolutionsSection,
  FeaturedProjectsSection,
  HowItWorksSection,
  PillarsSection,
} from '@/features/home';

export default function HomePage() {
  const { t, i18n } = useTranslation('home');
  const { data: meta } = useMeta();

  useEffect(() => {
    document.title = t('meta.title');
  }, [t, i18n.language]);

  const rawWhatsapp = meta?.contact?.whatsapp || '';
  const whatsappDigits = rawWhatsapp.replace(/[^0-9]/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';

  return (
    <div className="flex flex-col w-full text-on-surface">
      <HeroSection />
      <SolutionsSection />
      <FeaturedProjectsSection />
      <HowItWorksSection />
      <PillarsSection />

      <CtaBanner
        icon="auto_awesome"
        title={t('cta.title')}
        description={t('cta.description', {
          responseTime: t('claims.responseTime'),
        })}
        primaryAction={{
          label: t('cta.primaryAction'),
          to: ROUTES.CONTACT,
          icon: 'rocket_launch',
        }}
        secondaryAction={
          whatsappHref
            ? {
                label: t('cta.secondaryActionWhatsapp'),
                href: whatsappHref,
                icon: 'chat',
              }
            : {
                label: t('cta.secondaryActionContact'),
                to: ROUTES.CONTACT,
                icon: 'chat',
              }
        }
        features={[
          t('cta.features.noHiddenFees'),
          t('cta.features.freeConsultation'),
        ]}
        className="px-4 sm:px-6 lg:px-8 pb-12 lg:pb-16"
      />
    </div>
  );
}
