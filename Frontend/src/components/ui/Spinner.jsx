import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export function Spinner({ size = 'md', className = '' }) {
  const { t } = useTranslation('common');
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <span
      className={clsx(
        'inline-block animate-spin rounded-full border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizeMap[size] || sizeMap.md,
        className
      )}
      role="status"
      aria-label={t('actions.loading', { defaultValue: 'Loading' })}
    />
  );
}
