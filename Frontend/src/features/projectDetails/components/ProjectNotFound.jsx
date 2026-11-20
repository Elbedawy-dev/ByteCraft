import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../config/routes';
import { Button } from '../../../components/ui/Button';

export function ProjectNotFound() {
  const { t } = useTranslation('projectDetails');

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary mb-6 shadow-xl">
        <span className="material-symbols-outlined text-[42px]" aria-hidden="true">
          deployed_code_alert
        </span>
      </div>

      <span className="font-mono text-4xl sm:text-5xl font-extrabold text-primary mb-2">
        {t('notFound.code')}
      </span>

      <h1 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">
        {t('notFound.title')}
      </h1>

      <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
        {t('notFound.description')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to={ROUTES.PROJECTS}>
          <Button
            variant="primary-gradient"
            size="md"
            iconLeading={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                grid_view
              </span>
            }
          >
            {t('notFound.browseProjects')}
          </Button>
        </Link>

        <Link to={ROUTES.HOME}>
          <Button
            variant="secondary"
            size="md"
            iconLeading={
              <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100" aria-hidden="true">
                arrow_back
              </span>
            }
          >
            {t('notFound.backHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
