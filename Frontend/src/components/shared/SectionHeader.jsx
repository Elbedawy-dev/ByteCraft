import React from 'react';
import clsx from 'clsx';
import { Badge } from '../ui/Badge';

export function SectionHeader({
  badge,
  title,
  subtitle,
  action,
  align = 'start', // 'start' | 'center'
  className = '',
}) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-start',
        className
      )}
    >
      {badge && (
        <div>
          {typeof badge === 'string' ? (
            <Badge variant="primary" size="md">
              {badge}
            </Badge>
          ) : (
            badge
          )}
        </div>
      )}

      {title && (
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface">
          {title}
        </h2>
      )}

      {subtitle && (
        <p
          className={clsx(
            'text-sm sm:text-base text-on-surface-variant leading-relaxed',
            align === 'center' ? 'max-w-2xl' : 'max-w-3xl'
          )}
        >
          {subtitle}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
