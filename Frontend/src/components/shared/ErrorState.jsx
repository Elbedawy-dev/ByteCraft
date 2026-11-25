import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { fade } from '../../lib/motion';
import { Button } from '../ui/Button';

export function ErrorState({
  title,
  message,
  onRetry,
  className = '',
}) {
  const { t } = useTranslation('common');

  return (
    <m.div
      variants={fade}
      initial="hidden"
      animate="visible"
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-error/25 bg-error/5',
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-lg bg-chip-danger-bg text-chip-danger-fg flex items-center justify-center mb-4">
        <span className="material-symbols-rounded text-[26px]" aria-hidden="true">error</span>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-on-surface mb-1.5">
        {title || t('states.error.title', { defaultValue: 'Something went wrong' })}
      </h3>

      <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
        {message || t('states.error.message', { defaultValue: 'Unable to load content. Please try again.' })}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          iconLeading={<span className="material-symbols-rounded text-[18px]" aria-hidden="true">refresh</span>}
        >
          {t('actions.retry', { defaultValue: 'Try again' })}
        </Button>
      )}
    </m.div>
  );
}
