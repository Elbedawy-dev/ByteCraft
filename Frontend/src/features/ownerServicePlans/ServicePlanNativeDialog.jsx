import React, { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';

function isOutsideRect(event, rect) {
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/**
 * Native <dialog> modal styled per Screen 7 on desktop and full-screen sheet
 * with sticky header & footer on mobile (< 640px).
 */
export function ServicePlanNativeDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg', // 'sm' | 'md' | 'lg'
  preventClose = false,
  closeLabel = 'Close',
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

  const sizeClass =
    {
      sm: 'sm:max-w-md',
      md: 'sm:max-w-xl',
      lg: 'sm:max-w-3xl',
    }[size] || 'sm:max-w-3xl';

  const handlePointerDown = (e) => {
    if (preventClose || !panelRef.current) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = isOutsideRect(e, panelRef.current.getBoundingClientRect());
  };

  const handlePointerUp = (e) => {
    if (preventClose || !panelRef.current) return;
    if (pressedOutsideRef.current && isOutsideRect(e, panelRef.current.getBoundingClientRect())) {
      onClose?.();
    }
    pressedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? descId : undefined}
      className="bc-dialog bc-modal p-0 sm:p-4 items-stretch sm:items-center"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...{ closedby: preventClose ? 'none' : 'any' }}
    >
      <div
        ref={panelRef}
        className={clsx(
          'bc-modal-panel relative w-full bg-surface-container-low border-0 sm:border sm:border-outline-variant',
          'h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[88dvh] rounded-none sm:rounded-2xl',
          'shadow-2xl flex flex-col overflow-hidden',
          sizeClass,
          className
        )}
      >
        <div className="h-1 w-full bg-primary-gradient shrink-0" aria-hidden="true" />

        <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-outline-variant bg-surface-container/70 shrink-0 sticky top-0 z-10">
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
              className="w-11 h-11 shrink-0 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest flex items-center justify-center transition-colors"
              aria-label={closeLabel}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>

        {footer && (
          <div className="p-4 sm:p-5 border-t border-outline-variant bg-surface-container/80 shrink-0 sticky bottom-0 z-10">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
