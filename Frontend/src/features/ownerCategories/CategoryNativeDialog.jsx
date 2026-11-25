import React, { useId } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import {
  fade,
  scaleIn,
  sheetSlideUp,
  useAnimatedNativeDialog,
  useIsMobileViewport,
} from '@/lib/motion';

/**
 * Native <dialog> modal styled per Screen 7 on desktop and full-screen sheet
 * with sticky header & footer on mobile (< 640px).
 */
export function CategoryNativeDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg'
  preventClose = false,
  closeLabel = 'Close',
  className = '',
}) {
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
    preventClose,
  });

  const sizeClass =
    {
      sm: 'sm:max-w-md',
      md: 'sm:max-w-xl',
      lg: 'sm:max-w-2xl',
    }[size] || 'sm:max-w-xl';

  const panelVariants = isMobile ? sheetSlideUp : scaleIn;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? descId : undefined}
      className="bc-dialog bc-modal p-0 sm:p-4 items-stretch sm:items-center"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isOpen && (
          <>
            <m.div
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-hidden="true"
              className="fixed inset-0 bg-overlay backdrop-blur-sm"
            />
            <m.div
              ref={panelRef}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={clsx(
                'bc-modal-panel relative z-10 w-full bg-surface border-0 sm:border sm:border-outline-variant',
                'h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[88dvh] rounded-none sm:rounded-2xl',
                'shadow-card-hover flex flex-col overflow-hidden',
                sizeClass,
                className
              )}
            >
              <div className="h-1 w-full bg-primary-gradient shrink-0" aria-hidden="true" />

              <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-outline-variant bg-card shrink-0 sticky top-0 z-10">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-base sm:text-lg font-bold text-on-surface leading-snug">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p id={descId} className="text-xs sm:text-sm text-on-surface-variant mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                {!preventClose && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-11 h-11 shrink-0 rounded-xl bg-surface border border-card-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors"
                    aria-label={closeLabel}
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                )}
              </div>

              <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>

              {footer && (
                <div className="p-4 sm:p-5 border-t border-outline-variant bg-card shrink-0 sticky bottom-0 z-10">
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
