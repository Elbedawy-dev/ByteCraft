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
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-error/10 text-error border border-error/20',
    outline: 'bg-transparent text-on-surface border border-outline-variant',
  }[variant] || 'bg-surface-container-high text-on-surface-variant border border-outline-variant';

  const dotColors = {
    neutral: 'bg-on-surface-variant',
    primary: 'bg-primary',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-error',
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
