import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { useLang } from '../../app/providers';

export const Input = forwardRef(function Input(
  {
    type = 'text',
    className = '',
    error = false,
    iconLeading,
    iconTrailing,
    trailingAction,
    disabled = false,
    id,
    ...props
  },
  ref
) {
  const { dir } = useLang();
  const isPageRtl = dir === 'rtl';

  // Keep padding anchored to the outer wrapper's reading direction where icons/buttons
  // sit, even when an input sets dir="ltr" (e.g. email, phone, password) on an RTL page.
  const leadingPad = iconLeading
    ? isPageRtl
      ? 'pr-11'
      : 'pl-11'
    : isPageRtl
      ? 'pr-4'
      : 'pl-4';

  const trailingPad = trailingAction
    ? isPageRtl
      ? 'pl-12'
      : 'pr-12'
    : iconTrailing
      ? isPageRtl
        ? 'pl-11'
        : 'pr-11'
      : isPageRtl
        ? 'pl-4'
        : 'pr-4';

  return (
    <div className="relative flex items-center w-full">
      {iconLeading && (
        <div className="absolute start-3.5 flex items-center justify-center pointer-events-none text-muted">
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
          'w-full h-12 rounded-lg text-sm bg-input text-on-surface placeholder:text-placeholder transition-all duration-300 ease-nexus',
          'border outline-none focus-visible:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          leadingPad,
          trailingPad,
          error
            ? 'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/20'
            : 'border-input-border hover:border-outline focus:border-primary focus:ring-[3px] focus:ring-primary/20',
          className
        )}
        {...props}
      />
      {trailingAction ? (
        <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {trailingAction}
        </div>
      ) : (
        iconTrailing && (
          <div className="absolute end-3.5 flex items-center justify-center pointer-events-none text-muted">
            {iconTrailing}
          </div>
        )
      )}
    </div>
  );
});
