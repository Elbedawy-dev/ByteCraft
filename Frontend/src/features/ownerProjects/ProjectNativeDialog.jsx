import React, { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';
import { Badge } from '@/components/ui';

function isOutsideRect(event, rect) {
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/**
 * Native <dialog> modal matching Stitch bytecraft_7 on desktop (max-w-4xl, top gradient bar,
 * terminal icon, MERN Engine badge) and full-screen sheet with sticky header/footer on mobile.
 */
export function ProjectNativeDialog({
  isOpen,
  onClose,
  title,
  badgeText,
  subtitle,
  headerIcon = 'terminal',
  subHeader,
  children,
  footer,
  size = 'xl', // 'sm' | 'md' | 'xl'
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
      xl: 'sm:max-w-4xl',
    }[size] || 'sm:max-w-4xl';

  const handlePointerDown = (e) => {
    if (e.target instanceof Element && e.target.closest('[data-bc-select-portal]')) {
      pressedOutsideRef.current = false;
      return;
    }
    if (preventClose || !panelRef.current) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = isOutsideRect(e, panelRef.current.getBoundingClientRect());
  };

  const handlePointerUp = (e) => {
    if (e.target instanceof Element && e.target.closest('[data-bc-select-portal]')) {
      pressedOutsideRef.current = false;
      return;
    }
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
          'bc-modal-panel relative w-full bg-surface border-0 sm:border sm:border-outline-variant',
          'h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-2xl',
          'shadow-card-hover flex flex-col overflow-hidden',
          sizeClass,
          className
        )}
      >
        {/* Top Decorative Gradient Accent Line (Stitch Screen 7) */}
        <div className="h-1 w-full bg-primary-gradient shrink-0" aria-hidden="true" />

        {/* Sticky Modal Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 bg-card border-b border-outline-variant shrink-0 sticky top-0 z-20">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {headerIcon && (
                <div className="w-8 h-8 rounded-lg bg-badge-green-bg border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined material-symbols-filled text-[20px]">
                    {headerIcon}
                  </span>
                </div>
              )}
              {title && (
                <h2
                  id={titleId}
                  className="text-base sm:text-xl font-bold text-on-surface leading-snug"
                >
                  {title}
                </h2>
              )}
              {badgeText && (
                <Badge variant="primary" size="sm" className="font-mono">
                  <bdi dir="ltr">{badgeText}</bdi>
                </Badge>
              )}
            </div>
            {subtitle && (
              <p id={descId} className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
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

        {/* Sticky Section / Step Pills */}
        {subHeader && (
          <div className="px-4 sm:px-6 py-2.5 bg-card border-b border-outline-variant shrink-0">
            {subHeader}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-outline-variant bg-card shrink-0 sticky bottom-0 z-20">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
