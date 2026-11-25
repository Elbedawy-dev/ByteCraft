import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { fade, slideFromEnd } from '../../lib/motion';
import { Reveal } from '../../components/ui/Motion';
import { HeroCubes, SectionHeader } from '../../components/shared';
import { ContactSidebar } from '../../features/contact/ContactSidebar';
import { ContactForm } from '../../features/contact/ContactForm';
import { ContactValueProps } from '../../features/contact/ContactValueProps';

export default function ContactPage() {
  const { t } = useTranslation('contact');
  const { dir } = useLang();

  return (
    <div className="relative w-full overflow-x-clip flex-1 flex flex-col">
      {/* Header Band */}
      <div className="relative w-full bc-hero-wash py-14 lg:py-20 border-b border-outline-variant overflow-hidden">
        <Reveal
          variants={slideFromEnd}
          custom={dir}
          aria-hidden="true"
          className="hidden xl:block pointer-events-none absolute top-10 end-10 w-44 opacity-55 dark:opacity-35"
        >
          <HeroCubes className="w-full h-auto rtl:-scale-x-100" />
        </Reveal>

        <Reveal variants={fade} className="relative z-10 max-w-container mx-auto px-4 sm:px-6">
          <SectionHeader
            align="center"
            as="h1"
            badge={t('hero.badge')}
            title={t('hero.titlePrefix').trim()}
            accent={t('hero.titleBrand').trim()}
            subtitle={t('hero.subtitle')}
          />
        </Reveal>
      </div>

      {/* Main 12-Column Grid */}
      <div className="max-w-container w-full mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-14">
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <ContactSidebar />
          <ContactForm />
        </Reveal>

        <Reveal>
          <ContactValueProps />
        </Reveal>
      </div>
    </div>
  );
}
