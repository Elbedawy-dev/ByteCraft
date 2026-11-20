import React, { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui';

function isOutsideRect(event, rect) {
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/**
 * Native <dialog> modal leveraging styles/index.css (.bc-dialog.bc-modal)
 * and modern-web-guidance `dialog` rules (top-layer, Esc handling, overscroll containment,
 * safe focus management, press+release outside check so text selection never dismisses).
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
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      if (!preventClose) {
        onClose?.();
      }
    };

    const handleClose = () => {
      dialog.returnValue = '';
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose, preventClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }[size] || 'max-w-lg';

  const handlePointerDown = (e) => {
    if (!closeOnBackdrop || preventClose || !panelRef.current) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = isOutsideRect(e, panelRef.current.getBoundingClientRect());
  };

  const handlePointerUp = (e) => {
    if (!closeOnBackdrop || preventClose || !panelRef.current) return;
    if (pressedOutsideRef.current && isOutsideRect(e, panelRef.current.getBoundingClientRect())) {
      onClose?.();
    }
    pressedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="bc-dialog bc-modal p-0 sm:p-4 items-end sm:items-center"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...{ closedby: preventClose ? 'none' : closeOnBackdrop ? 'any' : 'closerequest' }}
    >
      <div
        ref={panelRef}
        className={clsx(
          'bc-modal-panel relative w-full bg-surface-container border border-outline-variant',
          'rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[94dvh] sm:max-h-[88dvh] overflow-hidden',
          sizeClasses,
          className
        )}
      >
        <div className="h-1 w-full bg-primary-gradient shrink-0" aria-hidden="true" />

        {(title || !preventClose) && (
          <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-outline-variant bg-surface-container-low/60 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-base sm:text-lg font-bold text-on-surface leading-snug"
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
                className="w-10 h-10 shrink-0 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>

        {footer && (
          <div className="p-4 sm:p-5 border-t border-outline-variant bg-surface-container-low/70 shrink-0 flex items-center justify-end gap-3 flex-wrap">
            {footer}
          </div>
        )}
      </div>
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
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      onClose?.();
    };

    const handleClose = () => {
      dialog.returnValue = '';
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }[size] || 'max-w-2xl';

  const handlePointerDown = (e) => {
    if (!panelRef.current) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = isOutsideRect(e, panelRef.current.getBoundingClientRect());
  };

  const handlePointerUp = (e) => {
    if (!panelRef.current) return;
    if (pressedOutsideRef.current && isOutsideRect(e, panelRef.current.getBoundingClientRect())) {
      onClose?.();
    }
    pressedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      data-side="end"
      aria-labelledby={title ? titleId : undefined}
      className="bc-dialog bc-drawer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...{ closedby: 'any' }}
    >
      <div
        ref={panelRef}
        className={clsx(
          'bc-drawer-panel relative h-full w-full bg-surface-container border-s border-outline-variant shadow-2xl flex flex-col overflow-hidden',
          widthClasses,
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low/80 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h2 id={titleId} className="text-base sm:text-lg font-bold text-on-surface truncate">
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
            className="w-11 h-11 shrink-0 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest flex items-center justify-center transition-colors"
            aria-label={closeLabel}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>

        {footer && (
          <div className="p-4 sm:p-5 border-t border-outline-variant bg-surface-container-low/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}

/**
 * Confirmation dialog following modern-web-guidance `dialog` rule:
 * places initial autoFocus on the safe Cancel action in destructive confirmations.
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
