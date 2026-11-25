import React, { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';
import { Input } from '../../components/ui';

/**
 * Password field with accessible show/hide toggle and leading lock icon.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  {
    disabled = false,
    className = '',
    iconName = 'lock',
    showLabel,
    hideLabel,
    ...props
  },
  ref
) {
  const { t } = useTranslation('common');
  const [showPassword, setShowPassword] = useState(false);

  const toggleLabel = showPassword
    ? hideLabel || t('actions.hidePassword')
    : showLabel || t('actions.showPassword');

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      dir="auto"
      spellCheck={false}
      autoCapitalize="none"
      autoCorrect="off"
      disabled={disabled}
      className={clsx('font-mono text-start', className)}
      iconLeading={
        <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
          {iconName}
        </span>
      }
      trailingAction={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-pressed={showPassword}
          aria-label={toggleLabel}
          className="h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-brand-soft/60 transition-colors duration-300 ease-nexus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={showPassword ? 'hide' : 'show'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={MOTION_TRANSITION}
              className="material-symbols-rounded text-[20px] block"
              aria-hidden="true"
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </m.span>
          </AnimatePresence>
        </button>
      }
      {...props}
    />
  );
});
