import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang, useTheme } from '../../app/providers';
import { navLinks } from '../../config/nav';
import { ROUTES } from '../../config/routes';
import { Button } from '../ui/Button';
import { MobileMenu } from './MobileMenu';

export function Navbar() {
  const { t } = useTranslation('common');
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant transition-colors">
        <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 group shrink-0 select-none"
            aria-label="ByteCraft Home"
          >
            <div className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[24px]">terminal</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-on-surface">
                Byte<span className="text-primary">Craft</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-muted uppercase -mt-1">
                Studio Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-1 bg-nav-pill px-3 py-1.5 rounded-full border border-outline-variant"
            aria-label="Primary"
          >
            {navLinks.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-nav-active-bg text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/80'
                  )
                }
              >
                {t(`nav.${item.key}`, { defaultValue: item.defaultLabel })}
              </NavLink>
            ))}
          </nav>

          {/* Desktop End Actions: Lang + Theme + CTA */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Language Segmented Toggle */}
            <div
              className="inline-flex items-center p-1 bg-surface rounded-xl border border-outline-variant select-none"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                  lang === 'ar'
                    ? 'bg-nav-active-bg text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                )}
                aria-pressed={lang === 'ar'}
              >
                AR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={clsx(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                  lang === 'en'
                    ? 'bg-nav-active-bg text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                )}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* CTA Button */}
            <Link to={ROUTES.CONTACT}>
              <Button
                variant="primary-gradient"
                size="sm"
                iconLeading={<span className="material-symbols-outlined text-[18px]">terminal</span>}
              >
                {t('nav.getStarted', { defaultValue: 'Start a Project' })}
              </Button>
            </Link>
          </div>

          {/* Mobile Actions: Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-label="Open main navigation menu"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
