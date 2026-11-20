import React from 'react';
import clsx from 'clsx';
import { formatMoney } from '../../lib/money';
import { useLang } from '../../app/providers';

export function PriceTag({
  piasters = 0,
  originalPiasters,
  prefix, // e.g. "Starting at" or localized string
  period, // e.g. "/ month"
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) {
  const { lang } = useLang();

  const formattedPrice = formatMoney(piasters, lang);
  const formattedOriginal = originalPiasters ? formatMoney(originalPiasters, lang) : null;

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base sm:text-lg font-bold',
    lg: 'text-xl sm:text-2xl font-bold',
    xl: 'text-2xl sm:text-3xl font-extrabold',
  }[size] || 'text-base sm:text-lg font-bold';

  return (
    <div className={clsx('inline-flex items-baseline flex-wrap gap-1.5', className)}>
      {prefix && (
        <span className="text-xs text-on-surface-variant font-normal">
          {prefix}
        </span>
      )}

      <span className={clsx('text-primary font-mono tracking-tight', sizeClasses)}>
        {formattedPrice}
      </span>

      {formattedOriginal && (
        <span className="text-xs sm:text-sm text-on-surface-variant line-through font-mono">
          {formattedOriginal}
        </span>
      )}

      {period && (
        <span className="text-xs text-on-surface-variant font-normal">
          {period}
        </span>
      )}
    </div>
  );
}
