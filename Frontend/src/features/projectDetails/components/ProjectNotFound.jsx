import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes';
import { Button } from '../../../components/ui/Button';
import { HeroCubes } from '../../../components/shared/HeroCubes';

export function ProjectNotFound() {
  const { t } = useTranslation('projectDetails');

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 lg:py-24 text-center min-h-[65vh] bc-hero-wash overflow-hidden">
      <div className="w-48 sm:w-56 mb-4 pointer-events-none select-none">
        <HeroCubes className="w-full h-auto rtl:-scale-x-100" />
      </div>

      <span className="font-mono text-6xl sm:text-7xl font-extrabold text-brand-gradient mb-3 leading-none">
        {t('notFound.code')}
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2">
        {t('notFound.title')}
      </h1>

      <p className="text-body-md text-muted max-w-md mb-8">
        {t('notFound.description')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3.5">
        <Link to={ROUTES.PROJECTS}>
          <Button
            variant="primary-gradient"
            size="lg"
            iconTrailing={
              <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
                arrow_forward
              </span>
            }
          >
            {t('notFound.browseProjects')}
          </Button>
        </Link>

        <Link to={ROUTES.HOME}>
          <Button
            variant="outline"
            size="lg"
          >
            {t('notFound.backHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
