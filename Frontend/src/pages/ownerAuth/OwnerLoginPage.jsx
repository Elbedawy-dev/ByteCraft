import React from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang, useTheme } from '../../app/providers';
import { ROUTES } from '../../config/routes';
import { Spinner } from '../../components/ui';
import {
  OwnerLoginForm,
  OwnerSessionProvider,
  useNoIndexMeta,
  useOwner,
} from '../../features/ownerAuth';

function getSafeRedirectTarget(rawRedirect) {
  if (
    typeof rawRedirect === 'string' &&
    rawRedirect.startsWith('/owner') &&
    !rawRedirect.startsWith(ROUTES.OWNER_LOGIN)
  ) {
    return rawRedirect;
  }
  return ROUTES.OWNER_DASHBOARD;
}

function OwnerLoginContent() {
  const { t } = useTranslation(['owner', 'common']);
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useOwner();

  useNoIndexMeta();

  const redirectTarget = getSafeRedirectTarget(searchParams.get('redirect'));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
        <Spinner size="lg" className="text-primary mb-3" />
        <p className="text-sm text-on-surface-variant">{t('owner:session.verifying')}</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="min-h-screen bc-hero-wash text-on-surface antialiased flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 sm:px-6">
      {/* Top Corner Language & Theme Controls */}
      <div className="absolute top-4 end-4 sm:top-6 sm:end-6 flex items-center gap-2 z-10">
        <div
          className="inline-flex items-center p-1 bg-surface rounded-xl border border-outline-variant shadow-sm select-none"
          role="group"
          aria-label={t('common:nav.language')}
        >
          <button
            type="button"
            onClick={() => setLang('ar')}
            aria-pressed={lang === 'ar'}
            className={clsx(
              'px-2.5 py-1.5 min-h-[36px] text-xs font-bold rounded-lg transition-colors',
              lang === 'ar'
                ? 'bg-nav-active-bg text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            )}
          >
            AR
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={clsx(
              'px-2.5 py-1.5 min-h-[36px] text-xs font-bold rounded-lg transition-colors',
              lang === 'en'
                ? 'bg-nav-active-bg text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            )}
          >
            EN
          </button>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? t('common:nav.switchToLight') : t('common:nav.switchToDark')
          }
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface border border-outline-variant shadow-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      {/* Centered Login Column */}
      <div className="w-full max-w-md flex flex-col items-center gap-6 relative z-10 pt-8 sm:pt-0">
        {/* Top Brand Title */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-headline-lg text-2xl sm:text-[28px] font-bold tracking-tight text-primary">
            ByteCraft
          </span>
          <span className="font-label-code text-xs text-on-surface-variant uppercase tracking-widest">
            {t('owner:login.brandSubtitle')}
          </span>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-badge-green-bg border border-primary/25">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
          <span className="font-label-code text-xs text-badge-green-text tracking-wide font-semibold">
            {t('owner:login.portalPill')}
          </span>
        </div>

        {/* Main Card */}
        <main className="w-full bg-card border border-card-border rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden">
          {/* Top Primary Gradient Accent Line */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-0 h-1 bg-primary-gradient"
          />

          <div className="flex flex-col gap-1.5 mb-6 text-start">
            <h1
              id="owner-login-heading"
              className="text-xl sm:text-[22px] font-bold text-on-surface tracking-tight"
            >
              {t('owner:login.title')}
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t('owner:login.subtitle')}
            </p>
          </div>

          <OwnerLoginForm
            onSuccess={() => {
              navigate(redirectTarget, { replace: true });
            }}
          />
        </main>

        {/* Back to Public Site */}
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5">
            arrow_back
          </span>
          <span>{t('owner:login.backToSite')}</span>
        </Link>
      </div>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <OwnerSessionProvider>
      <OwnerLoginContent />
    </OwnerSessionProvider>
  );
}
