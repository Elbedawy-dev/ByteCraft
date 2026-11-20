import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Card = forwardRef(function Card(
  {
    children,
    className = '',
    variant = 'default', // 'default' | 'flat' | 'interactive' | 'glass'
    padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
    as: Component = 'div',
    ...props
  },
  ref
) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  const variantStyles = {
    default: 'bg-surface-container border border-outline-variant rounded-xl',
    flat: 'bg-surface-container-low border border-outline-variant/60 rounded-xl',
    interactive:
      'bg-surface-container border border-outline-variant rounded-xl transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 cursor-pointer',
    glass:
      'bg-surface-container/70 backdrop-blur-md border border-outline-variant/80 rounded-xl shadow-lg',
  }[variant] || 'bg-surface-container border border-outline-variant rounded-xl';

  return (
    <Component
      ref={ref}
      className={clsx(variantStyles, paddingStyles, className)}
      {...props}
    >
      {children}
    </Component>
  );
});
