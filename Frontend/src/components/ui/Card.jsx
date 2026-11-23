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
    default: 'bg-card border border-card-border shadow-card rounded-xl',
    flat: 'bg-card border border-card-border shadow-card rounded-xl',
    interactive:
      'bg-card border border-card-border shadow-card rounded-xl transition-all duration-200 hover:bg-card-hover hover:border-card-hover-border hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
    glass:
      'bg-card/90 backdrop-blur-md border border-card-border shadow-card rounded-xl',
  }[variant] || 'bg-card border border-card-border shadow-card rounded-xl';

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
