import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'end', // 'end' | 'start' | 'bottom'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
  }[size] || 'max-w-sm';

  const positionStyles = {
    end: 'inset-y-0 end-0 h-full w-full',
    start: 'inset-y-0 start-0 h-full w-full',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl',
  }[side] || 'inset-y-0 end-0 h-full w-full';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Drawer'}
      className="fixed inset-0 z-50 flex animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={clsx(
          'fixed z-10 bg-surface border-outline-variant shadow-card-hover flex flex-col overflow-hidden',
          side === 'end' && 'border-s',
          side === 'start' && 'border-e',
          side === 'bottom' && 'border-t',
          side !== 'bottom' && widthClasses,
          positionStyles,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant shrink-0">
          <div className="font-semibold text-base sm:text-lg text-on-surface">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-[20px] block">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
