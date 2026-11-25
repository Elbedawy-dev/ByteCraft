import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { getSafeRedirectPath, ROUTES } from '../../config/routes';
import { useToast } from '../../app/providers';
import { Button, FormField, Input, Spinner } from '../../components/ui';
import { AuthCardShell } from '../../features/auth/AuthCardShell';
import { PasswordInput } from '../../features/auth/PasswordInput';
import { useAuth } from '../../features/auth/useAuth';

function extractLockoutMinutes(err) {
  const secDetail = err?.details?.find((d) => d.field === 'remainingSeconds')?.message;
  const seconds = Number(secDetail);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.max(1, Math.ceil(seconds / 60));
  }
  const match = String(err?.message || '').match(/(\d+)\s*minute/i);
  if (match) return Math.max(1, Number(match[1]));
  return 15;
}

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isAdmin, isLoading, login } = useAuth();
  const [bannerError, setBannerError] = useState(null);

  const rawRedirect = searchParams.get('redirect');
  const candidateRedirect = getSafeRedirectPath(rawRedirect, null);
  const safeRedirect =
    candidateRedirect &&
    candidateRedirect !== ROUTES.LOGIN &&
    candidateRedirect !== ROUTES.REGISTER &&
    candidateRedirect !== ROUTES.OWNER_LOGIN
      ? candidateRedirect
      : null;

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t('auth:validation.emailRequired'))
          .email(t('auth:validation.emailInvalid')),
        password: z
          .string()
          .min(1, t('auth:validation.passwordRequired')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isLoading) {
    return (
      <AuthCardShell title={t('auth:login.title')} subtitle={t('auth:login.subtitle')}>
        <div className="py-10 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-muted">{t('auth:common.verifyingSession')}</p>
        </div>
      </AuthCardShell>
    );
  }

  if (isAuthenticated) {
    const dest = safeRedirect || (isAdmin ? ROUTES.OWNER_DASHBOARD : ROUTES.ACCOUNT);
    return <Navigate to={dest} replace />;
  }

  const onSubmit = async (values) => {
    setBannerError(null);
    try {
      const loggedInUser = await login({
        email: values.email.trim(),
        password: values.password,
      });
      toast.success(t('auth:login.successToast'));
      const dest =
        safeRedirect ||
        (loggedInUser?.role === 'admin' ? ROUTES.OWNER_DASHBOARD : ROUTES.ACCOUNT);
      navigate(dest, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details?.length) {
          applyApiErrorsToForm(err, setError);
        }
        if (err.isLocked || err.status === 423 || err.code === 'ACCOUNT_LOCKED') {
          const minutes = extractLockoutMinutes(err);
          setBannerError({
            type: 'warning',
            icon: 'lock_clock',
            message: t('auth:login.errors.accountLocked', { count: minutes, minutes }),
          });
          return;
        }
        if (err.isRateLimited || err.status === 429) {
          setBannerError({
            type: 'warning',
            icon: 'hourglass_top',
            message: t('auth:login.errors.rateLimited'),
          });
          return;
        }
        if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
          setBannerError({
            type: 'error',
            icon: 'error',
            message: t('auth:login.errors.invalidCredentials'),
          });
          return;
        }
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setBannerError({
            type: 'error',
            icon: 'block',
            message: t('auth:login.errors.accountDisabled'),
          });
          return;
        }
      }
      setBannerError({
        type: 'error',
        icon: 'error',
        message: getApiErrorMessage(err, t),
      });
    }
  };

  return (
    <AuthCardShell
      badge={t('auth:login.badge')}
      title={t('auth:login.title')}
      subtitle={t('auth:login.subtitle')}
      headingId="login-page-heading"
      footer={
        <p>
          {t('auth:login.noAccount')}{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-bold text-primary hover:underline underline-offset-4"
          >
            {t('auth:login.createAccountLink')}
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
        aria-labelledby="login-page-heading"
      >
        {bannerError && (
          <div
            role="alert"
            className={clsx(
              'rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5',
              bannerError.type === 'warning'
                ? 'bg-chip-amber-bg/70 border-chip-amber-border text-chip-amber-fg'
                : 'bg-chip-danger-bg/70 border-chip-danger-border text-chip-danger-fg'
            )}
          >
            <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5" aria-hidden="true">
              {bannerError.icon}
            </span>
            <span className="leading-relaxed">{bannerError.message}</span>
          </div>
        )}

        <FormField
          id="login-email"
          label={t('auth:fields.emailLabel')}
          required
          error={errors.email?.message}
        >
          <Input
            type="email"
            dir="ltr"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            required
            placeholder={t('auth:fields.emailPlaceholder')}
            disabled={isSubmitting}
            className="text-start"
            iconLeading={
              <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                alternate_email
              </span>
            }
            {...register('email')}
          />
        </FormField>

        <div className="space-y-1.5">
          <FormField
            id="login-password"
            label={t('auth:fields.passwordLabel')}
            required
            error={errors.password?.message}
          >
            <PasswordInput
              autoComplete="current-password"
              enterKeyHint="done"
              required
              placeholder={t('auth:fields.passwordPlaceholder')}
              disabled={isSubmitting}
              {...register('password')}
            />
          </FormField>

          <div className="flex justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-semibold text-primary hover:underline underline-offset-4 py-1"
            >
              {t('auth:login.forgotPasswordLink')}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary-gradient"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full mt-1 font-bold"
          iconTrailing={
            <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100" aria-hidden="true">
              arrow_forward
            </span>
          }
        >
          {isSubmitting ? t('auth:login.submitting') : t('auth:login.submit')}
        </Button>
      </form>
    </AuthCardShell>
  );
}
