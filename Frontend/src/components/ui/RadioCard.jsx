import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const RadioCard = forwardRef(function RadioCard(
  {
    children,
    checked = false,
    onChange,
    disabled = false,
    name,
    value,
    id,
    className = '',
    header,
    description,
    badge,
    price,
    ...props
  },
  ref
) {
  const inputId = id || (name && value ? `radiocard-${name}-${value}` : undefined);

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        'relative flex flex-col p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer select-none',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface',
        checked
          ? 'bg-surface-container border-primary shadow-sm'
          : 'bg-surface-container-low border-outline-variant hover:border-outline hover:bg-surface-container',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      <input
        ref={ref}
        type="radio"
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={clsx(
              'w-5 h-5 mt-0.5 rounded-full border transition-all duration-150 flex items-center justify-center shrink-0',
              checked ? 'border-primary' : 'border-outline'
            )}
          >
            <div
              className={clsx(
                'w-2.5 h-2.5 rounded-full bg-primary transition-transform',
                checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            {header && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm sm:text-base text-on-surface">
                  {header}
                </span>
                {badge}
              </div>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
        {price && (
          <div className="shrink-0 text-end font-semibold text-sm sm:text-base text-primary">
            {price}
          </div>
        )}
      </div>
    </label>
  );
});
