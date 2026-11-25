import React from 'react';
import clsx from 'clsx';

export function Rating({
  rating = 0,
  count,
  size = 'sm',
  showCount = true,
  className = '',
}) {
  const numericRating = Number(rating) || 0;
  const stars = [1, 2, 3, 4, 5];

  const sizeClasses = {
    sm: 'text-[16px]',
    md: 'text-[20px]',
  }[size] || 'text-[16px]';

  return (
    <div className={clsx('inline-flex items-center gap-1.5 select-none', className)}>
      <div className="flex items-center text-star" aria-hidden="true">
        {stars.map((star) => {
          const diff = numericRating - (star - 1);
          const iconName = diff >= 0.75 ? 'star' : diff >= 0.25 ? 'star_half' : 'star';
          const isFilled = diff >= 0.25;

          return (
            <span
              key={star}
              aria-hidden="true"
              className={clsx(
                'material-symbols-rounded',
                sizeClasses,
                isFilled ? 'text-star' : 'text-outline'
              )}
              style={isFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {iconName}
            </span>
          );
        })}
      </div>

      {numericRating > 0 && (
        <span className="font-mono text-xs sm:text-sm font-bold text-on-surface ms-0.5">
          {numericRating.toFixed(1)}
        </span>
      )}

      {showCount && count !== undefined && count > 0 && (
        <span className="text-xs text-muted font-mono">
          ({count})
        </span>
      )}
    </div>
  );
}
