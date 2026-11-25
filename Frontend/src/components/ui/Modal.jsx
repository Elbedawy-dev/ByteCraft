import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { fade, scaleIn, sheetSlideUp, useIsMobileViewport } from '../../lib/motion';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnBackdrop = true,
  closeOnEsc = true,
}) {
  const dialogRef = useRef(null);
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  }[size] || 'max-w-lg';

  const panelVariants = isMobile ? sheetSlideUp : scaleIn;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <m.div
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-overlay backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal Panel (20px radius = rounded-2xl) */}
          <m.div
            ref={dialogRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={clsx(
              'relative w-full bg-card border border-card-border rounded-t-2xl sm:rounded-2xl shadow-card-hover flex flex-col max-h-[92vh] sm:max-h-[85vh] z-10 overflow-hidden',
              sizeClasses,
              className
            )}
          >
            {(title || onClose) && (
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-outline-variant shrink-0">
                <div>
                  {title && (
                    <h3 id="modal-title" className="text-base sm:text-lg font-bold text-on-surface">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p id="modal-description" className="text-xs sm:text-sm text-on-surface-variant mt-1">
                      {description}
                    </p>
                  )}
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center text-muted hover:text-on-surface rounded-full hover:bg-section-band transition-colors -me-1.5"
                    aria-label="Close dialog"
                  >
                    <span className="material-symbols-rounded text-[20px] block" aria-hidden="true">close</span>
                  </button>
                )}
              </div>
            )}

            <div className="p-5 sm:p-6 bc-scroll flex-1">{children}</div>

            {footer && (
              <div className="p-4 sm:p-6 border-t border-outline-variant bg-section-band/70 shrink-0 flex items-center justify-end gap-3 flex-wrap">
                {footer}
              </div>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
