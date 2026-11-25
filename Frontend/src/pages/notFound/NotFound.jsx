import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { HeroCubes } from '../../components/shared';
import { ROUTES } from '../../config/routes';

export default function NotFound() {
  const { t } = useTranslation('common');

  return (
    <section className="flex-1 bc-hero-wash relative overflow-hidden flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 text-center min-h-[70vh]">
      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        <div
          aria-hidden="true"
          className="w-40 sm:w-48 mb-4 pointer-events-none select-none rtl:-scale-x-100"
        >
          <HeroCubes className="w-full h-auto" />
        </div>

        <span className="text-6xl sm:text-8xl font-extrabold tracking-tight text-brand-gradient leading-none mb-3">
          404
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-3 tracking-tight">
          {t('errors.notFound.title', { defaultValue: 'Page not found' })}
        </h1>

        <p className="text-base text-on-surface-variant max-w-md mb-8 leading-relaxed">
          {t('errors.notFound.description', {
            defaultValue:
              'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
          })}
        </p>

        <Link to={ROUTES.HOME}>
          <Button
            variant="primary-gradient"
            size="lg"
            iconLeading={
              <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100">
                arrow_back
              </span>
            }
          >
            {t('actions.backToHome', { defaultValue: 'Back to Home' })}
          </Button>
        </Link>
      </div>
    </section>
  );
}
