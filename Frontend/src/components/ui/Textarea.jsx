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
        'w-full min-h-[140px] resize-y px-4 py-3 rounded-lg text-sm bg-input text-on-surface placeholder:text-placeholder transition-all duration-300 ease-nexus',
        'border outline-none focus-visible:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/20'
          : 'border-input-border hover:border-outline focus:border-primary focus:ring-[3px] focus:ring-primary/20',
        className
      )}
      {...props}
    />
  );
});
