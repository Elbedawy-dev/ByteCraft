import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { fade } from '../../lib/motion';

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}) {
  const { t } = useTranslation('common');

  return (
    <m.div
      variants={fade}
      initial="hidden"
      animate="visible"
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-outline bg-section-band',
        className
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center mb-4">
        <span className="material-symbols-rounded icon-gradient text-[26px]" aria-hidden="true">
          {icon}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-on-surface mb-1.5">
        {title || t('states.empty.title', { defaultValue: 'No items found' })}
      </h3>

      {description && (
        <p className="text-sm text-muted max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </m.div>
  );
}
