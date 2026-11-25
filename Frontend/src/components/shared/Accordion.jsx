import React, { useId, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';

export function Accordion({
  items = [],
  allowMultiple = false,
  className = '',
}) {
  const [openIds, setOpenIds] = useState([]);
  const baseId = useId();

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
    <div className={clsx('flex flex-col gap-3.5', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const panelId = `${baseId}-panel-${item.id}`;
        const triggerId = `${baseId}-trigger-${item.id}`;

        return (
          <div
            key={item.id}
            className={clsx(
              'rounded-xl border bg-card shadow-card overflow-hidden transition-[border-color,box-shadow,background-color] duration-300 ease-nexus',
              isOpen ? 'border-primary/45' : 'border-card-border hover:border-card-hover-border'
            )}
          >
            <button
              id={triggerId}
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-start font-bold text-sm sm:text-base text-on-surface hover:text-primary transition-colors duration-300 ease-nexus gap-4"
            >
              <span>{item.title}</span>
              <span
                className={clsx(
                  'w-9 h-9 rounded-full bg-brand-soft text-primary flex items-center justify-center shrink-0 transition-transform duration-300 ease-nexus',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              >
                <span className="material-symbols-rounded text-[20px]">
                  expand_more
                </span>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={MOTION_TRANSITION}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/60 pt-4">
                    {item.content}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
