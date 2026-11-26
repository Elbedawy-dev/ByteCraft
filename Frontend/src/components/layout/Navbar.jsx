import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { useLang, useTheme } from '../../app/providers';
import { navLinks } from '../../config/nav';
import { ROUTES } from '../../config/routes';
import { BRAND } from '../../config/brand';
import { MOTION_TRANSITION } from '../../lib/motion';
import { BrandLogo } from '../shared/LogoMark';
import { Button } from '../ui/Button';
import { LayoutMotion } from '../ui/Motion';
import { useAuth } from '../../features/auth';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';

export function Navbar() {
  const { t } = useTranslation('common');
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 inset-x-0 z-40 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-nexus',
          scrolled
            ? 'bg-background/95 border-card-border shadow-card'
            : 'bg-background/85 border-outline-variant'
        )}
      >
        <div className="h-20 max-w-container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo at start (top-left in LTR, top-right in RTL) */}
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center shrink-0 select-none"
            aria-label={`${BRAND.name} Home`}
          >
            <BrandLogo tone="auto" size="md" />
          </Link>

          {/* Centered Desktop Links with layoutId animated active gradient underline */}
          <LayoutMotion>
            <LayoutGroup id="navbar-active-links">
              <nav
                className="hidden lg:flex items-center gap-5 xl:gap-7 min-w-0"
                aria-label={t('nav.primaryNavLabel', { defaultValue: 'Primary' })}
              >
                {navLinks.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    end={item.to === ROUTES.HOME}
                    className={({ isActive }) =>
                      clsx(
                        'relative py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300 ease-nexus',
                        isActive
                          ? 'text-primary'
                          : 'text-on-surface-variant hover:text-on-surface'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{t(`nav.${item.key}`, { defaultValue: item.defaultLabel })}</span>
                        {isActive && (
                          <m.span
                            layoutId="navbar-active-indicator"
                            transition={MOTION_TRANSITION}
                            aria-hidden="true"
                            className="absolute bottom-0 inset-x-0 h-[2px] rounded-full bg-primary-gradient"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </LayoutGroup>
          </LayoutMotion>

          {/* Desktop End Actions: Theme Toggle + EN/AR Pill + Auth Controls */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* 44px rounded-full Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-brand-soft transition-colors duration-300 ease-nexus"
              aria-label={
                theme === 'dark'
                  ? t('nav.switchToLight', { defaultValue: 'Switch to light mode' })
                  : t('nav.switchToDark', { defaultValue: 'Switch to dark mode' })
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
                  transition={MOTION_TRANSITION}
                  className="material-symbols-rounded text-[20px] block"
                  aria-hidden="true"
                >
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </m.span>
              </AnimatePresence>
            </button>

            {/* EN/AR Segmented Pill */}
            <LayoutMotion>
              <LayoutGroup id="navbar-lang-toggle">
                <div
                  className="inline-flex items-center p-1 bg-section-band rounded-full border border-outline-variant select-none"
                  role="group"
                  aria-label={t('nav.language', { defaultValue: 'Language selection' })}
                >
                  {(['ar', 'en']).map((code) => {
                    const active = lang === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLang(code)}
                        className={clsx(
                          'relative px-3 py-1.5 min-h-[34px] text-xs font-bold rounded-full transition-colors duration-300 ease-nexus',
                          active ? 'text-primary' : 'text-muted hover:text-on-surface'
                        )}
                        aria-pressed={active}
                      >
                        {active && (
                          <m.span
                            layoutId="navbar-lang-pill"
                            transition={MOTION_TRANSITION}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full bg-card shadow-sm"
                          />
                        )}
                        <span className="relative z-10">{code.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </LayoutMotion>

            {isAuthenticated ? (
              <UserMenu />
            ) : !isLoading ? (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  to={ROUTES.LOGIN}
                  variant="outline"
                  size="sm"
                >
                    {t('nav.login', { defaultValue: 'Login' })}
                  </Button>
                <Button
                  to={ROUTES.REGISTER}
                  variant="primary-gradient"
                  size="sm"
                >
                    {t('nav.register', { defaultValue: 'Create account' })}
                  </Button>
              </div>
            ) : null}
          </div>

          {/* Mobile Actions: 44px Theme Toggle + Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-brand-soft transition-colors duration-300 ease-nexus"
              aria-label={
                theme === 'dark'
                  ? t('nav.switchToLight', { defaultValue: 'Switch to light mode' })
                  : t('nav.switchToDark', { defaultValue: 'Switch to dark mode' })
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
                  transition={MOTION_TRANSITION}
                  className="material-symbols-rounded text-[20px] block"
                  aria-hidden="true"
                >
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </m.span>
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={t('nav.openMenu', { defaultValue: 'Open main navigation menu' })}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-section-band border border-outline-variant text-on-surface hover:text-primary hover:bg-brand-soft transition-colors duration-300 ease-nexus"
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={mobileMenuOpen ? 'close' : 'menu'}
                  initial={{ opacity: 0, rotate: mobileMenuOpen ? -90 : 90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: mobileMenuOpen ? 90 : -90, scale: 0.8 }}
                  transition={MOTION_TRANSITION}
                  className="material-symbols-rounded text-[22px] block"
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? 'close' : 'menu'}
                </m.span>
              </AnimatePresence>
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
