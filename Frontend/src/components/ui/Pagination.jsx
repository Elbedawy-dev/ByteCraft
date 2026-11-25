import React from 'react';
import clsx from 'clsx';

export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

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
      className={clsx('flex items-center justify-center gap-1.5 sm:gap-2 select-none', className)}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="w-10 h-10 rounded-full border border-outline-variant bg-card text-on-surface-variant hover:text-primary hover:bg-brand-soft hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center"
      >
        <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
          chevron_left
        </span>
      </button>

      {pages.map((item, idx) => {
        if (item === '...') {
          return (
            <span
              key={`dots-${idx}`}
              className="w-9 h-10 flex items-center justify-center text-muted text-sm"
            >
              …
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
              'w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center font-mono',
              isCurrent
                ? 'btn-primary-gradient text-white font-bold'
                : 'border border-outline-variant bg-card text-on-surface-variant hover:text-primary hover:bg-brand-soft hover:border-primary/40'
            )}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="w-10 h-10 rounded-full border border-outline-variant bg-card text-on-surface-variant hover:text-primary hover:bg-brand-soft hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center"
      >
        <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
          chevron_right
        </span>
      </button>
    </nav>
  );
}
