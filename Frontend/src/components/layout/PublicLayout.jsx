import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AnimatedOutlet } from '../ui/Motion';

export function PublicLayout() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <a
        href="#main-content"
        className="visually-hidden focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-primary focus:text-on-primary focus:font-semibold"
      >
        {t('nav.skipToContent', { defaultValue: 'Skip to main content' })}
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
        <AnimatedOutlet className="flex-1 flex flex-col" />
      </main>
      <Footer />
    </div>
  );
}
