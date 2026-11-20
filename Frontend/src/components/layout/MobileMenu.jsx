import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang, useTheme } from '../../app/providers';
import { navLinks } from '../../config/nav';
import { ROUTES } from '../../config/routes';
import { Button } from '../ui/Button';

export function MobileMenu({ isOpen, onClose }) {
  const { t } = useTranslation('common');
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const drawerRef = useRef(null);

  // Close when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer sliding from the end side */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 end-0 z-10 w-full max-w-xs sm:max-w-sm bg-surface-container border-s border-outline-variant shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-200 rtl:slide-in-from-left"
      >
        <div className="space-y-6">
          {/* Header with close button */}
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="font-bold text-lg text-on-surface">ByteCraft</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-[22px] block">close</span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5" aria-label="Mobile">
            {navLinks.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-on-surface hover:bg-surface-container-high hover:text-primary'
                  )
                }
              >
                <span>{t(`nav.${item.key}`, { defaultValue: item.defaultLabel })}</span>
                <span className="material-symbols-outlined text-[16px] text-muted rtl:-scale-x-100">
                  chevron_right
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom controls: Language, Theme, CTA */}
        <div className="pt-6 border-t border-outline-variant space-y-4">
          <div className="flex items-center justify-between gap-3">
            {/* Language Segmented Toggle */}
            <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant/60">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={clsx(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                  lang === 'ar'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={clsx(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                  lang === 'en'
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                English
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          {/* CTA Button */}
          <NavLink to={ROUTES.CONTACT} className="block w-full">
            <Button
              variant="primary-gradient"
              size="md"
              className="w-full"
              iconLeading={<span className="material-symbols-outlined text-[20px]">terminal</span>}
            >
              {t('nav.getStarted', { defaultValue: 'Start a Project' })}
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
