import React, { useId } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import {
  fade,
  scaleIn,
  sheetSlideUp,
  useAnimatedNativeDialog,
  useIsMobileViewport,
} from '../../lib/motion';

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
  const { t } = useTranslation('common');
  const titleId = useId();
  const descId = useId();
  const isMobile = useIsMobileViewport();
  const {
    dialogRef,
    panelRef,
    handleExitComplete,
    handlePointerDown,
    handlePointerUp,
  } = useAnimatedNativeDialog({
    isOpen,
    onClose,
    preventClose: !onClose,
    closeOnBackdrop,
    closeOnEsc,
  });

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  }[size] || 'max-w-lg';

  const panelVariants = isMobile ? sheetSlideUp : scaleIn;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="bc-dialog bc-modal p-0 sm:p-4 items-end sm:items-center"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isOpen && (
          <>
            {/* Backdrop */}
            <m.div
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-overlay backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal Panel (20px radius = rounded-2xl) */}
            <m.div
              ref={panelRef}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={clsx(
                'relative w-full bg-card border border-card-border rounded-t-2xl sm:rounded-2xl shadow-card-hover flex flex-col max-h-[92dvh] sm:max-h-[85dvh] z-10 overflow-hidden',
                sizeClasses,
                className
              )}
            >
              {(title || onClose) && (
                <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-outline-variant shrink-0">
                  <div className="min-w-0">
                    {title && (
                      <h2 id={titleId} className="text-base sm:text-lg font-bold text-on-surface">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id={descId} className="text-xs sm:text-sm text-on-surface-variant mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-10 h-10 shrink-0 flex items-center justify-center text-muted hover:text-on-surface rounded-full hover:bg-section-band transition-colors -me-1.5"
                      aria-label={t('actions.close', { defaultValue: 'Close' })}
                    >
                      <span className="material-symbols-rounded text-[20px] block" aria-hidden="true">
                        close
                      </span>
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
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}
