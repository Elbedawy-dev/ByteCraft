import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';
import { getPasswordChecks } from './passwordValidation';

/**
 * Live password requirements checklist (min 8 chars, at least one letter, at least one number).
 * Never relies on color alone — pairs icons with clear text labels.
 */
export function PasswordChecklist({ password = '', id }) {
  const { t } = useTranslation('auth');
  const checks = getPasswordChecks(password);
  const hasStarted = Boolean(password && password.length > 0);

  const items = [
    {
      key: 'minLength',
      met: checks.minLength,
      label: t('passwordRules.minLength'),
    },
    {
      key: 'hasLetter',
      met: checks.hasLetter,
      label: t('passwordRules.hasLetter'),
    },
    {
      key: 'hasNumber',
      met: checks.hasNumber,
      label: t('passwordRules.hasNumber'),
    },
  ];

  return (
    <ul
      id={id}
      aria-label={t('passwordRules.title')}
      className="mt-2.5 p-3 rounded-xl bg-section-band border border-card-border space-y-1.5 text-xs"
    >
      {items.map((item) => (
        <li
          key={item.key}
          className={clsx(
            'flex items-center gap-2 transition-colors duration-300 ease-nexus',
            item.met
              ? 'text-success-text font-semibold'
              : hasStarted
                ? 'text-on-surface-variant'
                : 'text-muted'
          )}
        >
          <m.span
            key={item.met ? 'met' : 'pending'}
            initial={{ opacity: 0.6, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={MOTION_TRANSITION}
            className="material-symbols-rounded text-[16px] shrink-0 block"
            aria-hidden="true"
          >
            {item.met ? 'check_circle' : 'radio_button_unchecked'}
          </m.span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
