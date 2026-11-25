import React from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { useMeta } from '@/api/meta';
import { CtaBanner } from '@/components/shared';
import {
  HeroSection,
  SolutionsSection,
  AboutPreviewSection,
  FeaturedProjectsSection,
  PillarsSection,
  TestimonialsSection,
} from '@/features/home';

export default function HomePage() {
  const { t } = useTranslation('home');
  const { data: meta } = useMeta();

  const rawWhatsapp = meta?.contact?.whatsapp || '';
  const whatsappDigits = rawWhatsapp.replace(/[^0-9]/g, '');
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';

  return (
    <div className="flex flex-col w-full text-on-surface">
      <HeroSection />
      <SolutionsSection />
      <AboutPreviewSection />
      <FeaturedProjectsSection />
      <PillarsSection />
      <TestimonialsSection />

      <CtaBanner
        badge={t('cta.eyebrow')}
        title={t('cta.title')}
        accent={t('cta.titleAccent')}
        description={t('cta.description')}
        primaryAction={{
          label: t('cta.primaryAction'),
          to: ROUTES.CONTACT,
          icon: 'arrow_forward',
        }}
        secondaryAction={
          whatsappHref
            ? {
                label: t('cta.secondaryActionWhatsapp'),
                href: whatsappHref,
                icon: 'chat',
              }
            : {
                label: t('cta.secondaryActionProjects'),
                to: ROUTES.PROJECTS,
                icon: 'arrow_forward',
              }
        }
        features={[
          t('cta.features.noHiddenFees'),
          t('cta.features.freeConsultation'),
        ]}
      />
    </div>
  );
}
