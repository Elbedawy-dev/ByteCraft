import React, { useId } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import { Badge } from '@/components/ui';
import {
  fade,
  scaleIn,
  sheetSlideUp,
  useAnimatedNativeDialog,
  useIsMobileViewport,
} from '@/lib/motion';

/**
 * Native <dialog> modal for Owner Project Creation/Editing (max-w-4xl, top gradient bar,
 * deployed_code gradient icon chip, 20px rounded-2xl panel on desktop, full-screen sheet on mobile).
 */
export function ProjectNativeDialog({
  isOpen,
  onClose,
  title,
  badgeText,
  subtitle,
  headerIcon = 'deployed_code',
  subHeader,
  children,
  footer,
  size = 'xl', // 'sm' | 'md' | 'xl'
  preventClose = false,
  closeLabel,
  className = '',
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
    preventClose,
  });

  const sizeClass =
    {
      sm: 'sm:max-w-md',
      md: 'sm:max-w-xl',
      xl: 'sm:max-w-4xl',
    }[size] || 'sm:max-w-4xl';

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
                'bc-modal-panel relative z-10 w-full bg-card border-0 sm:border sm:border-card-border',
                'h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[90dvh] rounded-none sm:rounded-2xl',
                'shadow-card-hover flex flex-col overflow-hidden',
                sizeClass,
                className
              )}
            >
        {/* Top Decorative Gradient Accent Line */}
        <div className="h-1 w-full bg-primary-gradient shrink-0" aria-hidden="true" />

        {/* Sticky Modal Header */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 bg-card border-b border-card-border shrink-0 sticky top-0 z-20">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {headerIcon && (
                <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center shrink-0" aria-hidden="true">
                  <span className="material-symbols-rounded icon-gradient text-[20px]">
                    {headerIcon}
                  </span>
                </div>
              )}
              {title && (
                <h2
                  id={titleId}
                  className="text-base sm:text-xl font-extrabold text-on-surface leading-snug"
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
              className="w-10 h-10 shrink-0 rounded-full bg-section-band border border-card-border text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors"
              aria-label={closeLabel || t('actions.close', { defaultValue: 'Close' })}
            >
              <span className="material-symbols-rounded text-[20px]" aria-hidden="true">close</span>
            </button>
          )}
        </div>

        {/* Sticky Section / Step Pills */}
        {subHeader && (
          <div className="px-4 sm:px-6 py-2.5 bg-section-band border-b border-card-border shrink-0">
            {subHeader}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 bc-scroll flex-1">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-card-border bg-card shrink-0 sticky bottom-0 z-20">
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
