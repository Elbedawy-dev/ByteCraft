import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ContactSidebar } from '../../features/contact/ContactSidebar';
import { ContactForm } from '../../features/contact/ContactForm';
import { ContactValueProps } from '../../features/contact/ContactValueProps';

export default function ContactPage() {
  const { t } = useTranslation('contact');

  useEffect(() => {
    document.title = t('pageTitle');
  }, [t]);

  return (
    <div className="relative w-full overflow-hidden py-10 sm:py-14">
      {/* Subtle Ambient Glows */}
      <div
        className="absolute top-20 -end-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 -start-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">
        {/* Hero Header */}
        <header className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/70 text-primary">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-xs tracking-wider uppercase">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="text-headline-xl-mobile md:text-headline-xl font-extrabold text-on-surface">
            {t('hero.titlePrefix')}
            <span className="text-primary">{t('hero.titleBrand')}</span>
          </h1>

          <p className="text-body-md sm:text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </header>

        {/* Main 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <ContactSidebar />
          <ContactForm />
        </div>

        {/* Bottom 3 Value Propositions */}
        <ContactValueProps />
      </div>
    </div>
  );
}
