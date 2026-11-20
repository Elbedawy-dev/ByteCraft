import React from 'react';
import clsx from 'clsx';
import { Button } from './Button';

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  // Generate pagination items
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPages();

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={clsx('flex items-center justify-center gap-1 sm:gap-2 select-none', className)}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">
          chevron_left
        </span>
      </Button>

      {pages.map((item, idx) => {
        if (item === '...') {
          return (
            <span
              key={`dots-${idx}`}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-on-surface-variant text-sm"
            >
              ...
            </span>
          );
        }

        const isCurrent = item === page;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={isCurrent ? 'page' : undefined}
            className={clsx(
              'w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center font-mono',
              isCurrent
                ? 'bg-primary text-[#0A0A0A] font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            )}
          >
            {item}
          </button>
        );
      })}

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100">
          chevron_right
        </span>
      </Button>
    </nav>
  );
}
