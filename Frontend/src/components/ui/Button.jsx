import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';
import { Spinner } from './Spinner';

/**
 * Nexus Pill Button
 * Sizes: sm=40px (h-10), md=48px (h-12), lg=56px (h-14)
 * Variants:
 * - primary-gradient: brand gradient (#2B72CF -> #5443A9) + white text + glow on hover
 * - secondary: surface with 1px border and brand text
 * - outline: surface with brand border and brand text
 * - ghost: subtle brand-soft hover surface
 * - danger: semantic danger fill
 *
 * Polymorphic semantics:
 * - Pass `to` to render a React Router `<Link>` styled as a button (avoids nested `<a><button>`).
 * - Pass `href` to render a native `<a>` styled as a button.
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary-gradient',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    to,
    href,
    className = '',
    iconLeading,
    iconTrailing,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  const baseStyles =
    'relative inline-flex items-center justify-center rounded-full font-semibold transition-[background-color,border-color,color,box-shadow,filter,opacity] duration-300 ease-nexus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'h-10 px-5 text-xs sm:text-sm gap-2',
    md: 'h-12 px-6 text-sm gap-2',
    lg: 'h-14 px-8 text-base gap-2.5',
    icon: 'h-12 w-12 p-0',
    'icon-sm': 'h-10 w-10 p-0',
  }[size] || 'h-12 px-6 text-sm gap-2';

  const variantStyles = {
    'primary-gradient': 'btn-primary-gradient',
    secondary:
      'bg-surface text-primary border border-outline hover:bg-brand-soft hover:border-primary/45 active:bg-brand-soft/80',
    outline:
      'bg-surface text-primary border border-primary/50 hover:bg-brand-soft hover:border-primary active:bg-brand-soft/80',
    ghost:
      'text-on-surface-variant hover:bg-brand-soft hover:text-primary active:bg-brand-soft/80 bg-transparent font-medium',
    danger:
      'bg-danger text-on-error hover:opacity-95 active:opacity-90 shadow-sm',
  }[variant] || 'btn-primary-gradient';

  const classes = clsx(
    baseStyles,
    sizeStyles,
    variantStyles,
    (to || href) && isDisabled && 'opacity-50 pointer-events-none cursor-not-allowed',
    className
  );

  const innerContent = loading ? (
    <>
      <Spinner size={size === 'sm' || size === 'icon-sm' ? 'sm' : 'md'} />
      {size !== 'icon' && size !== 'icon-sm' && (
        <span className="opacity-95">{children}</span>
      )}
    </>
  ) : (
    <>
      {iconLeading && <span className="inline-flex shrink-0">{iconLeading}</span>}
      {children}
      {iconTrailing && <span className="inline-flex shrink-0">{iconTrailing}</span>}
    </>
  );

  if (to !== undefined) {
    return (
      <Link
        ref={ref}
        to={to}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {innerContent}
      </Link>
    );
  }

  if (href !== undefined) {
    return (
      <a
        ref={ref}
        href={href}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        className={classes}
        {...props}
      >
        {innerContent}
      </a>
    );
  }

  return (
    <m.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      data-fm-tap="true"
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={MOTION_TRANSITION}
      className={classes}
      {...props}
    >
      {innerContent}
    </m.button>
  );
});
