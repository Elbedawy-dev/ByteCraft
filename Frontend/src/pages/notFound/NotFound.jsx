import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../config/routes';

export default function NotFound() {
  const { t } = useTranslation('common');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary mb-6 shadow-xl">
        <span className="material-symbols-outlined text-[44px]">search_off</span>
      </div>

      <span className="font-mono text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
        404
      </span>

      <h1 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">
        {t('errors.notFound.title', { defaultValue: 'Page not found' })}
      </h1>

      <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
        {t(
          'errors.notFound.description',
          { defaultValue: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.' }
        )}
      </p>

      <Link to={ROUTES.HOME}>
        <Button
          variant="primary-gradient"
          size="md"
          iconLeading={<span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">arrow_back</span>}
        >
          {t('actions.backToHome', { defaultValue: 'Back to Home' })}
        </Button>
      </Link>
    </div>
  );
}
