import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { useLang } from '../../app/providers';
import { fade, getDrawerVariants } from '../../lib/motion';

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'end', // 'end' | 'start' | 'bottom'
  size = 'md', // 'sm' | 'md' | 'lg'
  tone = 'surface', // 'surface' | 'navy'
  className = '',
}) {
  const drawerRef = useRef(null);
  const { lang } = useLang();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isOpen]);

  const widthClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
  }[size] || 'max-w-sm';

  const positionStyles = {
    end: 'inset-y-0 end-0 h-full w-full rounded-s-2xl',
    start: 'inset-y-0 start-0 h-full w-full rounded-e-2xl',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl',
  }[side] || 'inset-y-0 end-0 h-full w-full rounded-s-2xl';

  const isNavy = tone === 'navy';
  const drawerVariants = getDrawerVariants(side, dir);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Drawer'}
          className="fixed inset-0 z-50 flex"
        >
          {/* Backdrop */}
          <m.div
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-overlay backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel (20px radius) */}
          <m.div
            ref={drawerRef}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              'fixed z-10 shadow-card-hover flex flex-col overflow-hidden',
              isNavy
                ? 'bg-navy text-navy-text border-navy-border'
                : 'bg-card text-on-surface border-card-border',
              side === 'end' && 'border-s',
              side === 'start' && 'border-e',
              side === 'bottom' && 'border-t',
              side !== 'bottom' && widthClasses,
              positionStyles,
              className
            )}
          >
            {/* Header */}
            <div
              className={clsx(
                'flex items-center justify-between p-4 sm:p-5 border-b shrink-0',
                isNavy ? 'border-navy-border' : 'border-outline-variant'
              )}
            >
              <div className={clsx('font-bold text-base sm:text-lg', isNavy ? 'text-white' : 'text-on-surface')}>
                {title}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
                  isNavy
                    ? 'text-navy-text hover:text-white hover:bg-white/10'
                    : 'text-muted hover:text-on-surface hover:bg-section-band'
                )}
                aria-label="Close drawer"
              >
                <span className="material-symbols-rounded text-[20px] block" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
