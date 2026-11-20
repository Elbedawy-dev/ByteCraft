import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}) {
  const { t } = useTranslation('common');

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/40',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-on-surface mb-1">
        {title || t('states.empty.title', { defaultValue: 'No items found' })}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}
