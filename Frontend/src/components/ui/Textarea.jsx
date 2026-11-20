import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Textarea = forwardRef(function Textarea(
  {
    className = '',
    error = false,
    disabled = false,
    rows = 4,
    ...props
  },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={clsx(
        'w-full min-h-[140px] resize-y px-4 py-3 rounded-lg text-sm bg-surface-container-low text-on-surface placeholder:text-muted/60 transition-colors duration-150',
        'border outline-none focus:ring-2 focus:ring-primary focus:border-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-error focus:border-error focus:ring-error/20'
          : 'border-outline-variant hover:border-outline',
        className
      )}
      {...props}
    />
  );
});
