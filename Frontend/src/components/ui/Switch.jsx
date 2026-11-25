import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Switch = forwardRef(function Switch(
  {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    className = '',
    id,
    name,
    ...props
  },
  ref
) {
  const inputId = id || (name ? `switch-${name}` : undefined);

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        'group inline-flex items-center justify-between gap-4 min-h-[44px] cursor-pointer select-none py-1.5',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {(label || description) && (
        <div className="flex flex-col flex-1 min-w-0">
          {label && (
            <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-muted mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
      <div className="relative shrink-0 flex items-center">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={inputId}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        {/* Track: 44px wide x 24px high */}
        <div
          className={clsx(
            'w-11 h-6 rounded-full bg-section-band transition-[background-color,border-color,box-shadow] duration-300 ease-nexus border border-control-border',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            'peer-checked:bg-primary-gradient peer-checked:border-transparent'
          )}
        />
        {/* Knob: 20px x 20px */}
        <div
          className={clsx(
            'absolute start-0.5 top-0.5 w-5 h-5 rounded-full bg-white border border-control-border/60 transition-transform duration-300 ease-nexus shadow-sm pointer-events-none',
            'peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5 peer-checked:border-transparent'
          )}
        />
      </div>
    </label>
  );
});
