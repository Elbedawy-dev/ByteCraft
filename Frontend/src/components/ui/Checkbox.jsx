import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Checkbox = forwardRef(function Checkbox(
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
    error,
    ...props
  },
  ref
) {
  const inputId = id || (name ? `checkbox-${name}` : undefined);

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        'group inline-flex items-start gap-3 min-h-[44px] cursor-pointer select-none py-1.5',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          aria-invalid={Boolean(error)}
          {...props}
        />
        <div
          className={clsx(
            'w-5 h-5 rounded-[5px] border transition-all duration-150 flex items-center justify-center',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
            error
              ? 'border-error'
              : 'border-outline peer-hover:border-primary',
            'peer-checked:bg-primary peer-checked:border-primary peer-checked:text-[#0A0A0A]'
          )}
        >
          <span className="material-symbols-outlined text-[16px] font-bold opacity-0 peer-checked:opacity-100 transition-opacity">
            check
          </span>
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-on-surface-variant mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});
