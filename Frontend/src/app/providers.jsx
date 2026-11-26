import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LazyMotion, MotionConfig, AnimatePresence, domAnimation, m } from 'framer-motion';
import { STORAGE_KEYS } from '../lib/storage';
import { AuthProvider } from '../features/auth/AuthProvider';
import { MOTION_TRANSITION, getDirectionSign } from '../lib/motion';

// 1. React Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Do not retry 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

// 2. Language Context & Hook
const LangContext = createContext({
  lang: 'ar',
  dir: 'rtl',
  setLang: () => {},
  toggleLang: () => {},
});

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a Providers component');
  }
  return context;
}

// 3. Theme Context & Hook
const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a Providers component');
  }
  return context;
}

// 4. Toast Context & Hook
const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  removeToast: () => {},
});

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a Providers component');
  }
  return context.toast;
}

export function useToastManager() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastManager must be used within a Providers component');
  }
  return context;
}

function readInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  } catch {
    return 'light';
  }
}

// Main Providers component
export function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={MOTION_TRANSITION}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

export function Providers({ children }) {
  const { i18n } = useTranslation();
  const transitionTimerRef = useRef(null);

  // Lang state
  const [lang, setLangState] = useState(readInitialLang);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const setLang = useCallback((newLang) => {
    const valid = newLang === 'en' ? 'en' : 'ar';
    setLangState(valid);
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, valid);
    } catch {
      // Ignore storage write errors
    }
    i18n.changeLanguage(valid);
    document.documentElement.setAttribute('lang', valid);
    document.documentElement.setAttribute('dir', valid === 'ar' ? 'rtl' : 'ltr');
  }, [i18n]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }, [lang, dir]);

  // Theme state (first visit is always Light; persisted in bc_theme_v3)
  const [theme, setThemeState] = useState(readInitialTheme);

  const setTheme = useCallback((newTheme) => {
    const valid = newTheme === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;

    root.classList.add('bc-theme-transition');
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      root.classList.remove('bc-theme-transition');
      transitionTimerRef.current = null;
    }, 340);

    setThemeState(valid);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, valid);
    } catch {
      // Ignore storage write errors
    }

    if (valid === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    const metaScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaScheme) {
      metaScheme.setAttribute('content', valid);
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', valid === 'dark' ? '#0B1020' : '#FFFFFF');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    const metaScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaScheme) {
      metaScheme.setAttribute('content', theme);
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastFn = useCallback((options) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const item = typeof options === 'string' ? { message: options, type: 'info' } : options;
    const duration = item.duration ?? 4000;

    const newToast = {
      id,
      type: item.type || 'info',
      message: item.message,
      title: item.title,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  toastFn.success = useCallback((message, options = {}) => toastFn({ ...options, message, type: 'success' }), [toastFn]);
  toastFn.error = useCallback((message, options = {}) => toastFn({ ...options, message, type: 'error' }), [toastFn]);
  toastFn.warning = useCallback((message, options = {}) => toastFn({ ...options, message, type: 'warning' }), [toastFn]);
  toastFn.info = useCallback((message, options = {}) => toastFn({ ...options, message, type: 'info' }), [toastFn]);

  const langValue = useMemo(() => ({ lang, dir, setLang, toggleLang }), [lang, dir, setLang, toggleLang]);
  const themeValue = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  const toastValue = useMemo(() => ({ toasts, toast: toastFn, removeToast }), [toasts, toastFn, removeToast]);

  return (
    <QueryClientProvider client={queryClient}>
      <LangContext.Provider value={langValue}>
        <ThemeContext.Provider value={themeValue}>
          <ToastContext.Provider value={toastValue}>
            <AuthProvider>
              <MotionProvider>
                {children}
                <ToastContainer />
              </MotionProvider>
            </AuthProvider>
          </ToastContext.Provider>
        </ThemeContext.Provider>
      </LangContext.Provider>
    </QueryClientProvider>
  );
}

// Inline Toast Container
function ToastContainer() {
  const { toasts, removeToast } = useToastManager();
  const { t } = useTranslation('common');
  const { lang } = useLang();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const dirSign = getDirectionSign(dir);

  return (
    <div
      className="fixed bottom-4 end-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label={t('nav.notifications', { defaultValue: 'Notifications' })}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toastItem) => (
          <m.div
            key={toastItem.id}
            initial={{ opacity: 0, x: dirSign * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dirSign * 24 }}
            transition={MOTION_TRANSITION}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border bg-card text-on-surface shadow-card-hover transition-colors duration-300 ease-nexus ${
              toastItem.type === 'success'
                ? 'border-success/40'
                : toastItem.type === 'error'
                  ? 'border-error/45'
                  : toastItem.type === 'warning'
                    ? 'border-warning/45'
                    : 'border-card-border'
            }`}
          >
            <span
              className={`material-symbols-rounded text-[20px] shrink-0 mt-0.5 ${
                toastItem.type === 'success'
                  ? 'text-success-text'
                  : toastItem.type === 'error'
                    ? 'text-error'
                    : toastItem.type === 'warning'
                      ? 'text-warning'
                      : 'text-info'
              }`}
              aria-hidden="true"
            >
              {toastItem.type === 'success'
                ? 'check_circle'
                : toastItem.type === 'error'
                  ? 'error'
                  : toastItem.type === 'warning'
                    ? 'warning'
                    : 'info'}
            </span>
            <div className="flex-1 min-w-0">
              {toastItem.title && <div className="font-semibold text-sm text-on-surface mb-0.5">{toastItem.title}</div>}
              <div className="text-sm text-on-surface-variant break-words">{toastItem.message}</div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toastItem.id)}
              className="text-muted hover:text-on-surface hover:bg-section-band p-1.5 rounded-full transition-colors shrink-0"
              aria-label={t('actions.close', { defaultValue: 'Close' })}
            >
              <span className="material-symbols-rounded text-[16px] block" aria-hidden="true">close</span>
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
