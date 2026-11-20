import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

/**
 * Native <dialog> modal / bottom-sheet wrapper following modern-web-guidance:
 * - Uses showModal() for top-layer promotion, inert background, focus containment, and Esc dismissal
 * - Supports light-dismiss via closedby="any" + pointerdown/pointerup bounding-rect fallback
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
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.setAttribute('closedby', closeOnBackdrop ? 'any' : 'closerequest');
  }, [closeOnBackdrop]);

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

    const handleClose = () => {
      dialog.returnValue = '';
      onClose?.();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !closeOnBackdrop) return;

    const isOutsidePanel = (event) => {
      const panel = panelRef.current;
      if (!panel) return false;
      const rect = panel.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };

    const handlePointerDown = (event) => {
      pressedOutsideRef.current = isOutsidePanel(event);
    };

    const handlePointerUp = (event) => {
      if (pressedOutsideRef.current && isOutsidePanel(event)) {
        dialog.close();
      }
      pressedOutsideRef.current = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [closeOnBackdrop]);

  const isSheet = variant === 'bottom-sheet';

  return (
    <dialog
      ref={dialogRef}
      data-side={isSheet ? 'bottom' : undefined}
      aria-labelledby={labelledBy}
      aria-label={!labelledBy ? ariaLabel : undefined}
      className={clsx(
        'bc-dialog',
        isSheet ? 'bc-drawer p-0' : 'bc-modal p-3 sm:p-6',
        dialogClassName
      )}
    >
      <div
        ref={panelRef}
        className={clsx(
          isSheet
            ? 'bc-drawer-panel w-full max-w-2xl bg-surface-container border-t border-outline-variant rounded-t-2xl shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden'
            : 'bc-modal-panel relative w-full bg-surface-container border border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden',
          panelClassName
        )}
      >
        {children}
      </div>
    </dialog>
  );
}
