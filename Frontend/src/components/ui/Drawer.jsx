import React, { useId } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import { useLang } from '../../app/providers';
import { fade, getDrawerVariants, useAnimatedNativeDialog } from '../../lib/motion';

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'end', // 'end' | 'start' | 'bottom'
  size = 'md', // 'sm' | 'md' | 'lg'
  tone = 'surface', // 'surface' | 'navy'
  className = '',
}) {
  const { t } = useTranslation('common');
  const titleId = useId();
  const { lang } = useLang();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
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
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
  }[size] || 'max-w-sm';

  const positionStyles = {
    end: 'h-full w-full rounded-s-2xl',
    start: 'h-full w-full rounded-e-2xl',
    bottom: 'max-h-[85dvh] w-full rounded-t-2xl',
  }[side] || 'h-full w-full rounded-s-2xl';

  const isNavy = tone === 'navy';
  const drawerVariants = getDrawerVariants(side, dir);

  return (
    <dialog
      ref={dialogRef}
      data-side={side}
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? t('nav.mobileMenu', { defaultValue: 'Drawer' }) : undefined}
      className="bc-dialog bc-drawer"
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

            {/* Drawer Panel (20px radius) */}
            <m.div
              ref={panelRef}
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={clsx(
                'relative z-10 shadow-card-hover flex flex-col overflow-hidden',
                isNavy
                  ? 'bg-navy text-navy-text border-navy-border'
                  : 'bg-card text-on-surface border-card-border',
                side === 'end' && 'border-s',
                side === 'start' && 'border-e',
                side === 'bottom' && 'border-t',
                side !== 'bottom' && widthClasses,
                positionStyles,
                className
              )}
            >
              {/* Header */}
              <div
                className={clsx(
                  'flex items-center justify-between gap-3 p-4 sm:p-5 border-b shrink-0',
                  isNavy ? 'border-navy-border' : 'border-outline-variant'
                )}
              >
                <div
                  id={title ? titleId : undefined}
                  className={clsx('font-bold text-base sm:text-lg min-w-0', isNavy ? 'text-white' : 'text-on-surface')}
                >
                  {title}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={clsx(
                    'w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-colors',
                    isNavy
                      ? 'text-navy-text hover:text-white hover:bg-white/10'
                      : 'text-muted hover:text-on-surface hover:bg-section-band'
                  )}
                  aria-label={t('actions.close', { defaultValue: 'Close' })}
                >
                  <span className="material-symbols-rounded text-[20px] block" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </dialog>
  );
}
