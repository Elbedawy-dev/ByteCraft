import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { Spinner } from './Spinner';

/**
 * Button component per ByteCraft design contract
 * Variants:
 * - primary-gradient: Owner override #52E982 -> #19ECB5, text #0A0A0A, glow
 * - outline: border with primary color
 * - ghost: subtle hover surface
 * - danger: error background
 * - secondary: surface container high
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary-gradient',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    className = '',
    iconLeading,
    iconTrailing,
    ...props
  },
  ref
) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'h-10 px-4 text-xs sm:text-sm rounded-lg gap-1.5',
    md: 'h-12 px-6 text-sm rounded-xl gap-2',
    lg: 'h-14 px-8 text-base rounded-xl gap-2.5 font-semibold',
    icon: 'h-12 w-12 rounded-xl p-0',
    'icon-sm': 'h-10 w-10 rounded-lg p-0',
  }[size] || 'h-12 px-6 text-sm rounded-xl gap-2';

  const variantStyles = {
    'primary-gradient': 'btn-primary-gradient font-semibold',
    outline:
      'border border-primary text-primary hover:bg-primary/10 active:bg-primary/20 bg-transparent',
    ghost:
      'text-on-surface hover:bg-surface-container-high hover:text-primary active:bg-surface-container-highest bg-transparent',
    danger:
      'bg-error text-white hover:bg-error/90 active:bg-error/80 shadow-sm',
    secondary:
      'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant hover:border-outline',
  }[variant] || 'btn-primary-gradient font-semibold';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(baseStyles, sizeStyles, variantStyles, className)}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'sm' || size === 'icon-sm' ? 'sm' : 'md'} />
          {size !== 'icon' && size !== 'icon-sm' && (
            <span className="opacity-90">{children}</span>
          )}
        </>
      ) : (
        <>
          {iconLeading && <span className="inline-flex shrink-0">{iconLeading}</span>}
          {children}
          {iconTrailing && <span className="inline-flex shrink-0">{iconTrailing}</span>}
        </>
      )}
    </button>
  );
});
