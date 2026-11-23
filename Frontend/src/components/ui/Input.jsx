import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(function Input(
  {
    type = 'text',
    className = '',
    error = false,
    iconLeading,
    iconTrailing,
    disabled = false,
    id,
    ...props
  },
  ref
) {
  return (
    <div className="relative flex items-center w-full">
      {iconLeading && (
        <div className="absolute start-3.5 flex items-center justify-center pointer-events-none text-on-surface-variant">
          {iconLeading}
        </div>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={clsx(
          'w-full h-12 rounded-lg text-sm bg-input text-on-surface placeholder:text-placeholder transition-colors duration-150',
          'border outline-none focus:ring-2 focus:ring-input-focus focus:border-input-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          iconLeading ? 'ps-11' : 'ps-4',
          iconTrailing ? 'pe-11' : 'pe-4',
          error
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'border-input-border hover:border-outline',
          className
        )}
        {...props}
      />
      {iconTrailing && (
        <div className="absolute end-3.5 flex items-center justify-center pointer-events-none text-on-surface-variant">
          {iconTrailing}
        </div>
      )}
    </div>
  );
});
