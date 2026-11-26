import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { MOTION_TRANSITION, slideFromEnd } from '../../lib/motion';

export function ToastItem({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) {
  const { t } = useTranslation('common');
  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const styleMap = {
    success: 'bg-card border-success/40 text-on-surface',
    error: 'bg-card border-error/45 text-on-surface',
    warning: 'bg-card border-warning/45 text-on-surface',
    info: 'bg-card border-info/40 text-on-surface',
  };

  const iconColor = {
    success: 'text-success-text',
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <m.div
      role="alert"
      variants={slideFromEnd}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={MOTION_TRANSITION}
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-card-hover transition-colors duration-300 ease-nexus',
        styleMap[type] || styleMap.info,
        className
      )}
    >
      <span
        className={clsx(
          'material-symbols-rounded text-[20px] shrink-0 mt-0.5',
          iconColor[type] || iconColor.info
        )}
        aria-hidden="true"
      >
        {iconMap[type] || 'info'}
      </span>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold text-sm text-on-surface mb-0.5">{title}</div>}
        <div className="text-sm text-on-surface-variant break-words">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-on-surface p-1 rounded-full hover:bg-section-band transition-colors shrink-0"
          aria-label={t('actions.close', { defaultValue: 'Close' })}
        >
          <span className="material-symbols-rounded text-[16px] block" aria-hidden="true">close</span>
        </button>
      )}
    </m.div>
  );
}
