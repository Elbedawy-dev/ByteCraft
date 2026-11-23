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
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium rounded-full',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium rounded-full',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium rounded-full',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5 font-medium rounded-full';

  const variantStyles = {
    neutral: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
    primary: 'bg-chip-mint-bg text-chip-mint-fg border border-chip-mint-border',
    success: 'bg-chip-mint-bg text-chip-mint-fg border border-chip-mint-border',
    warning: 'bg-chip-amber-bg text-chip-amber-fg border border-chip-amber-border',
    error: 'bg-chip-danger-bg text-chip-danger-fg border border-chip-danger-border',
    info: 'bg-chip-blue-bg text-chip-blue-fg border border-chip-blue-border',
    outline: 'bg-surface text-on-surface border border-input-border',
  }[variant] || 'bg-surface-container-high text-on-surface-variant border border-outline-variant';

  const dotColors = {
    neutral: 'bg-on-surface-variant',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    outline: 'bg-on-surface',
  }[variant] || 'bg-on-surface-variant';

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
