import React from 'react';
import clsx from 'clsx';
import { formatMoney } from '../../lib/money';
import { useLang } from '../../app/providers';

export function PriceTag({
  piasters = 0,
  originalPiasters,
  prefix,
  period,
  size = 'md',
  className = '',
}) {
  const { lang } = useLang();

  const formattedPrice = formatMoney(piasters, lang);
  const formattedOriginal = originalPiasters ? formatMoney(originalPiasters, lang) : null;

  const sizeClasses = {
    sm: 'text-sm font-bold',
    md: 'text-base sm:text-lg font-extrabold',
    lg: 'text-xl sm:text-2xl font-extrabold',
    xl: 'text-2xl sm:text-3xl font-extrabold',
  }[size] || 'text-base sm:text-lg font-extrabold';

  return (
    <div className={clsx('inline-flex items-baseline flex-wrap gap-1.5', className)}>
      {prefix && (
        <span className="text-xs text-muted font-medium">
          {prefix}
        </span>
      )}

      <span className={clsx('text-primary font-mono tracking-tight', sizeClasses)}>
        {formattedPrice}
      </span>

      {formattedOriginal && (
        <span className="text-xs sm:text-sm text-muted line-through font-mono">
          {formattedOriginal}
        </span>
      )}

      {period && (
        <span className="text-xs text-muted font-medium">
          {period}
        </span>
      )}
    </div>
  );
}
