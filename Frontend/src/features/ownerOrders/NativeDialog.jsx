import React, { useId } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { Button } from '@/components/ui';
import { useLang } from '@/app/providers';
import {
  fade,
  getDrawerVariants,
  scaleIn,
  sheetSlideUp,
  useAnimatedNativeDialog,
  useIsMobileViewport,
} from '@/lib/motion';

/**
 * Native <dialog> modal leveraging styles/index.css (.bc-dialog.bc-modal)
 * with 20px radius (rounded-2xl) and Nexus Light/Dark backdrop & card tokens.
 */
export function OwnerModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  preventClose = false,
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
    closeOnBackdrop,
  });

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
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
                'bc-modal-panel relative z-10 w-full bg-card border border-card-border',
                'rounded-t-2xl sm:rounded-2xl shadow-card-hover flex flex-col max-h-[94dvh] sm:max-h-[88dvh] overflow-hidden',
                sizeClasses,
                className
              )}
            >
              <div className="h-1 w-full bg-primary-gradient shrink-0" aria-hidden="true" />

              {(title || !preventClose) && (
                <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-card-border bg-card shrink-0">
                  <div className="min-w-0">
                    {title && (
                      <h2
                        id={titleId}
                        className="text-base sm:text-lg font-extrabold text-on-surface leading-snug"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id={descId} className="text-xs sm:text-sm text-on-surface-variant mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {!preventClose && onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-10 h-10 shrink-0 rounded-full bg-surface-soft border border-card-border text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <span className="material-symbols-rounded text-[20px]">close</span>
                    </button>
                  )}
                </div>
              )}

              <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>

              {footer && (
                <div className="p-4 sm:p-5 border-t border-card-border bg-card shrink-0 flex items-center justify-end gap-3 flex-wrap">
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

/**
 * Native <dialog> side drawer sliding from the logical `end` side (left in RTL, right in LTR).
 */
export function OwnerDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  headerBadge,
  children,
  footer,
  size = 'lg',
  closeLabel = 'Close',
  className = '',
}) {
  const titleId = useId();
  const { lang } = useLang();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const drawerVariants = getDrawerVariants('end', dir);
  const {
    dialogRef,
    panelRef,
    handleExitComplete,
    handlePointerDown,
    handlePointerUp,
  } = useAnimatedNativeDialog({
    isOpen,
    onClose,
  });

  const widthClasses = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }[size] || 'max-w-2xl';

  return (
    <dialog
      ref={dialogRef}
      data-side="end"
      aria-labelledby={title ? titleId : undefined}
      className="bc-dialog bc-drawer"
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
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={clsx(
                'bc-drawer-panel relative z-10 h-full w-full bg-card border-s border-card-border rounded-s-2xl shadow-card-hover flex flex-col overflow-hidden',
                widthClasses,
                className
              )}
            >
              <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-card-border bg-card shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {title && (
                      <h2 id={titleId} className="text-base sm:text-lg font-extrabold text-on-surface truncate">
                        {title}
                      </h2>
                    )}
                    {headerBadge}
                  </div>
                  {subtitle && (
                    <div className="text-xs sm:text-sm text-on-surface-variant mt-1">{subtitle}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 shrink-0 rounded-full bg-surface-soft border border-card-border text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors"
                  aria-label={closeLabel}
                >
                  <span className="material-symbols-rounded text-[20px]">close</span>
                </button>
              </div>

              <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>

              {footer && (
                <div className="p-4 sm:p-5 border-t border-card-border bg-card shrink-0">
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

/**
 * Confirmation dialog with safe initial autoFocus on Cancel for destructive confirmations.
 */
export function OwnerConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
  children,
}) {
  return (
    <OwnerModal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      preventClose={loading}
      size="sm"
      title={title}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            autoFocus={variant === 'danger'}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary-gradient'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
            autoFocus={variant !== 'danger'}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {message && <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>}
      {children}
    </OwnerModal>
  );
}
