import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Select = forwardRef(function Select(
  {
    children,
    className = '',
    error = false,
    disabled = false,
    iconLeading,
    ...props
  },
  ref
) {
  return (
    <div className="relative flex items-center w-full">
      {iconLeading && (
        <div className="absolute start-3.5 flex items-center justify-center pointer-events-none text-on-surface-variant z-10">
          {iconLeading}
        </div>
      )}
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={clsx(
          'w-full h-12 rounded-lg text-sm bg-surface-container-low text-on-surface transition-colors duration-150',
          'appearance-none border outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          // dark mode option styling
          '[&>option]:bg-surface-container [&>option]:text-on-surface',
          iconLeading ? 'ps-11' : 'ps-4',
          'pe-10', // Room for custom chevron on the end side
          error
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'border-outline-variant hover:border-outline',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute end-3.5 flex items-center justify-center pointer-events-none text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">
          expand_more
        </span>
      </div>
    </div>
  );
});
