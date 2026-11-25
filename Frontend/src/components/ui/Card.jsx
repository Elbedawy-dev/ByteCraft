import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';

export const Card = forwardRef(function Card(
  {
    children,
    className = '',
    variant = 'default', // 'default' | 'flat' | 'soft' | 'interactive' | 'panel' | 'glass'
    padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
    as: Component = 'div',
    ...props
  },
  ref
) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-6 sm:p-7',
    lg: 'p-7 sm:p-8',
  }[padding];

  const variantStyles = {
    default: 'bg-card border border-card-border shadow-card rounded-xl',
    flat: 'bg-card border border-card-border shadow-card rounded-xl',
    soft: 'bg-section-band border border-card-border rounded-xl',
    interactive: 'bc-card-hover rounded-xl cursor-pointer',
    panel: 'bg-card border border-card-border shadow-card rounded-2xl',
    glass: 'bg-card/90 backdrop-blur-md border border-card-border shadow-card rounded-xl',
  }[variant] || 'bg-card border border-card-border shadow-card rounded-xl';

  if (variant === 'interactive' && typeof Component === 'string') {
    const MotionComponent = m[Component] || m.div;
    return (
      <MotionComponent
        ref={ref}
        data-fm-hover="true"
        whileHover={{ y: -4 }}
        transition={MOTION_TRANSITION}
        className={clsx(variantStyles, paddingStyles, className)}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }

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
