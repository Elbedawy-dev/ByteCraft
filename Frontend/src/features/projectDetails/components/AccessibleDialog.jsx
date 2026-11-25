import React from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import {
  fade,
  scaleIn,
  sheetSlideUp,
  useAnimatedNativeDialog,
  useIsMobileViewport,
} from '../../../lib/motion';

/**
 * Native <dialog> modal / bottom-sheet wrapper following modern-web-guidance:
 * - Uses showModal() for top-layer promotion, inert background, focus containment, and Esc dismissal
 * - Delays native dialog.close() until the 300ms Framer exit animation completes
 * - Keeps Esc (via cancel event) and backdrop pointerdown/pointerup dismissal working cleanly
 * - Uses overscroll-behavior: contain on dialog:modal and ::backdrop (in styles/index.css)
 */
export function AccessibleDialog({
  isOpen,
  onClose,
  labelledBy,
  ariaLabel,
  variant = 'modal', // 'modal' | 'bottom-sheet'
  panelClassName = '',
  dialogClassName = '',
  closeOnBackdrop = true,
  children,
}) {
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
    closeOnBackdrop,
  });

  const isSheet = variant === 'bottom-sheet';
  const panelVariants = isSheet || isMobile ? sheetSlideUp : scaleIn;

  return (
    <dialog
      ref={dialogRef}
      data-side={isSheet ? 'bottom' : undefined}
      aria-labelledby={labelledBy}
      aria-label={!labelledBy ? ariaLabel : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={clsx(
        'bc-dialog',
        isSheet ? 'bc-drawer p-0' : 'bc-modal p-3 sm:p-6',
        dialogClassName
      )}
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
                'relative z-10',
                isSheet
                  ? 'bc-drawer-panel w-full max-w-2xl bg-card border-t border-card-border rounded-t-2xl shadow-card-hover flex flex-col max-h-[88dvh] overflow-hidden'
                  : 'bc-modal-panel w-full bg-card border border-card-border rounded-2xl shadow-card-hover flex flex-col overflow-hidden',
                panelClassName
              )}
            >
              {children}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}
