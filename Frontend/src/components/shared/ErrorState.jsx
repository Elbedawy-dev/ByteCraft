import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export function ErrorState({
  title,
  message,
  onRetry,
  className = '',
}) {
  const { t } = useTranslation('common');

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-error/20 bg-error/5',
        className
      )}
      role="alert"
    >
      <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px]">error_outline</span>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-on-surface mb-1">
        {title || t('states.error.title', { defaultValue: 'Something went wrong' })}
      </h3>

      <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
        {message || t('states.error.message', { defaultValue: 'Unable to load content. Please try again.' })}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          iconLeading={<span className="material-symbols-outlined text-[18px]">refresh</span>}
        >
          {t('actions.retry', { defaultValue: 'Try again' })}
        </Button>
      )}
    </div>
  );
}
