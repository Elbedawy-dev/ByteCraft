import React from 'react';
import clsx from 'clsx';

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  icon,
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-semibold rounded-full',
    md: 'text-xs px-3 py-1 gap-1.5 font-semibold rounded-full',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold rounded-full',
  }[size] || 'text-xs px-3 py-1 gap-1.5 font-semibold rounded-full';

  const variantStyles = {
    neutral: 'bg-section-band text-on-surface-variant border border-outline-variant',
    primary: 'bg-brand-soft text-brand-soft-text border border-chip-mint-border',
    success: 'bg-chip-emerald-bg text-chip-emerald-fg border border-chip-emerald-border',
    warning: 'bg-chip-amber-bg text-chip-amber-fg border border-chip-amber-border',
    error: 'bg-chip-danger-bg text-chip-danger-fg border border-chip-danger-border',
    danger: 'bg-chip-danger-bg text-chip-danger-fg border border-chip-danger-border',
    info: 'bg-chip-sky-bg text-chip-sky-fg border border-chip-sky-border',
    outline: 'bg-surface text-on-surface border border-outline',
    gradient: 'btn-primary-gradient border-transparent',
  }[variant] || 'bg-section-band text-on-surface-variant border border-outline-variant';

  const dotColors = {
    neutral: 'bg-muted',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    danger: 'bg-error',
    info: 'bg-info',
    outline: 'bg-on-surface',
    gradient: 'bg-white',
  }[variant] || 'bg-muted';

  return (
    <span
      className={clsx(
        'inline-flex items-center shrink-0 leading-none select-none',
        sizeStyles,
        variantStyles,
        className
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
