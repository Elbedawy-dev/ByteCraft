import React, { useState } from 'react';
import clsx from 'clsx';

export function Accordion({
  items = [], // [{ id, title, content }]
  allowMultiple = false,
  className = '',
}) {
  const [openIds, setOpenIds] = useState([]);

  const toggle = (id) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={clsx('divide-y divide-card-border rounded-xl border border-card-border bg-card shadow-card overflow-hidden', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div key={item.id} className="transition-colors">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-start font-semibold text-sm sm:text-base text-on-surface hover:text-primary transition-colors gap-4"
            >
              <span>{item.title}</span>
              <span
                className={clsx(
                  'material-symbols-outlined text-[20px] text-on-surface-variant transition-transform duration-200 shrink-0',
                  isOpen && 'rotate-180 text-primary'
                )}
              >
                expand_more
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-on-surface-variant leading-relaxed animate-in fade-in duration-150">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
