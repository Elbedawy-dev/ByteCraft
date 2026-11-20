import React from 'react';
import clsx from 'clsx';

/**
 * FormField component enforcing ByteCraft form layout rules:
 * - Label above control with 8px gap (mb-2)
 * - Required marker: small primary-colored '*' after label
 * - Hint/error text below control: 12-13px, mt-2
 * - aria-describedby linkage for accessibility
 */
export function FormField({
  label,
  required = false,
  error,
  hint,
  id,
  className = '',
  children,
}) {
  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;

  return (
    <div className={clsx('flex flex-col', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-on-surface mb-2 flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-primary font-bold text-base leading-none" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Control slot */}
      <div className="relative w-full">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              id: children.props.id || id,
              error: children.props.error !== undefined ? children.props.error : Boolean(error),
              'aria-describedby':
                children.props['aria-describedby'] ||
                [errorId, hintId].filter(Boolean).join(' ') ||
                undefined,
            })
          : children}
      </div>

      {/* Error or Hint message */}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs sm:text-[13px] text-error mt-2 flex items-center gap-1.5 animate-in fade-in"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs sm:text-[13px] text-on-surface-variant mt-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Honeypot anti-spam field per contract section 6 line 69
 * (tabindex="-1", autocomplete="off", visually hidden, aria-hidden, always empty)
 */
export function HoneypotField({ register, name = 'website' }) {
  const registerProps = register ? register(name) : { name };

  return (
    <div
      aria-hidden="true"
      style={{
        opacity: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        height: 0,
        width: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
      tabIndex={-1}
    >
      <label htmlFor={`hp-${name}`}>Leave this field empty</label>
      <input
        id={`hp-${name}`}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...registerProps}
      />
    </div>
  );
}
