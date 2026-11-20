import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function Breadcrumbs({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx('flex items-center text-xs sm:text-sm text-on-surface-variant', className)}
    >
      <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && (
                <span
                  className="material-symbols-outlined text-[14px] text-muted shrink-0 rtl:-scale-x-100 select-none"
                  aria-hidden="true"
                >
                  chevron_right
                </span>
              )}

              {isLast || !item.href ? (
                <span
                  className={clsx(
                    'font-medium truncate max-w-[200px] sm:max-w-xs',
                    isLast ? 'text-on-surface' : 'text-on-surface-variant'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
