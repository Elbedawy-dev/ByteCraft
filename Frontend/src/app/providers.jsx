import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

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
  theme: 'dark',
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

// Main Providers component
export function Providers({ children }) {
  const { i18n } = useTranslation();

  // Lang state
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('bc_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const setLang = useCallback((newLang) => {
    const valid = newLang === 'en' ? 'en' : 'ar';
    setLangState(valid);
    localStorage.setItem('bc_lang', valid);
    i18n.changeLanguage(valid);
    document.documentElement.setAttribute('lang', valid);
    document.documentElement.setAttribute('dir', valid === 'ar' ? 'rtl' : 'ltr');
  }, [i18n]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  useEffect(() => {
    // Sync initial state to HTML element
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }, [lang, dir]);

  // Theme state
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('bc_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Dark mode default as per contract section 5
  });

  const setTheme = useCallback((newTheme) => {
    const valid = newTheme === 'light' ? 'light' : 'dark';
    setThemeState(valid);
    localStorage.setItem('bc_theme', valid);
    if (valid === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', valid === 'dark' ? '#0A0A0A' : '#FAFAF9');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

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
      type: item.type || 'info', // 'success' | 'error' | 'warning' | 'info'
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

  // Sugar methods on toast
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
            {children}
            <ToastContainer />
          </ToastContext.Provider>
        </ThemeContext.Provider>
      </LangContext.Provider>
    </QueryClientProvider>
  );
}

// Inline Toast Container using Toast UI component
function ToastContainer() {
  const { toasts, removeToast } = useToastManager();
  const { dir } = useLang();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none"
      style={{
        [dir === 'rtl' ? 'left' : 'right']: '1rem',
      }}
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${
            t.type === 'success'
              ? 'bg-surface-container border-primary/30 text-on-surface'
              : t.type === 'error'
              ? 'bg-surface-container border-error/40 text-on-surface'
              : t.type === 'warning'
              ? 'bg-surface-container border-amber-500/40 text-on-surface'
              : 'bg-surface-container border-outline-variant text-on-surface'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
              t.type === 'success'
                ? 'text-primary'
                : t.type === 'error'
                ? 'text-error'
                : t.type === 'warning'
                ? 'text-amber-400'
                : 'text-primary'
            }`}
          >
            {t.type === 'success'
              ? 'check_circle'
              : t.type === 'error'
              ? 'error'
              : t.type === 'warning'
              ? 'warning'
              : 'info'}
          </span>
          <div className="flex-1 min-w-0">
            {t.title && <div className="font-semibold text-sm mb-0.5">{t.title}</div>}
            <div className="text-sm text-on-surface-variant break-words">{t.message}</div>
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[16px] block">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
