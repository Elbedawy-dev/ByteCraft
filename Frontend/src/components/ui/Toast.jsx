import React from 'react';
import clsx from 'clsx';

export function ToastItem({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) {
  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const styleMap = {
    success: 'bg-surface-container border-primary/30 text-on-surface',
    error: 'bg-surface-container border-error/40 text-on-surface',
    warning: 'bg-surface-container border-amber-500/40 text-on-surface',
    info: 'bg-surface-container border-outline-variant text-on-surface',
  };

  const iconColor = {
    success: 'text-primary',
    error: 'text-error',
    warning: 'text-amber-400',
    info: 'text-primary',
  };

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all',
        styleMap[type] || styleMap.info,
        className
      )}
    >
      <span
        className={clsx(
          'material-symbols-outlined text-[20px] shrink-0 mt-0.5',
          iconColor[type] || iconColor.info
        )}
      >
        {iconMap[type] || 'info'}
      </span>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold text-sm mb-0.5">{title}</div>}
        <div className="text-sm text-on-surface-variant break-words">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors shrink-0"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-[16px] block">close</span>
        </button>
      )}
    </div>
  );
}
