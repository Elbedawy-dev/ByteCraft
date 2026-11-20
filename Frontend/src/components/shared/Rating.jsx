import React from 'react';
import clsx from 'clsx';

export function Rating({
  rating = 0, // e.g. 4.8
  count, // e.g. 24
  size = 'sm', // 'sm' | 'md'
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
      <div className="flex items-center text-amber-400">
        {stars.map((star) => {
          const diff = numericRating - (star - 1);
          let iconName = 'star';
          if (diff >= 0.75) {
            iconName = 'star';
          } else if (diff >= 0.25) {
            iconName = 'star_half';
          } else {
            iconName = 'star';
          }
          const isFilled = diff >= 0.25;

          return (
            <span
              key={star}
              className={clsx(
                'material-symbols-outlined',
                sizeClasses,
                isFilled ? 'text-amber-400 fill-current' : 'text-outline-variant/60'
              )}
              style={isFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {iconName}
            </span>
          );
        })}
      </div>

      {numericRating > 0 && (
        <span className="font-mono text-xs sm:text-sm font-semibold text-on-surface ms-0.5">
          {numericRating.toFixed(1)}
        </span>
      )}

      {showCount && count !== undefined && count > 0 && (
        <span className="text-xs text-on-surface-variant font-mono">
          ({count})
        </span>
      )}
    </div>
  );
}
