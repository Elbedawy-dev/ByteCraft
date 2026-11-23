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
        'w-full min-h-[140px] resize-y px-4 py-3 rounded-lg text-sm bg-input text-on-surface placeholder:text-placeholder transition-colors duration-150',
        'border outline-none focus:ring-2 focus:ring-input-focus focus:border-input-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-error focus:border-error focus:ring-error/20'
          : 'border-input-border hover:border-outline',
        className
      )}
      {...props}
    />
  );
});
