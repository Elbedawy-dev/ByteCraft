import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useResendVerification, useVerifyEmail } from '../../api/auth';
import { ROUTES } from '../../config/routes';
import { useToast } from '../../app/providers';
import { Button, FormField, Input, Spinner } from '../../components/ui';
import { AuthCardShell } from '../../features/auth/AuthCardShell';
import { useAuth } from '../../features/auth/useAuth';

export default function VerifyEmailPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const toast = useToast();

  const { user, isAuthenticated, refresh } = useAuth();
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const [status, setStatus] = useState(() => (token ? 'verifying' : 'missing'));
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setStatus(user?.emailVerified ? 'already_verified' : 'missing');
      return undefined;
    }

    setStatus('verifying');
    verifyMutation
      .mutateAsync(token)
      .then(() => {
        if (!active) return;
        setStatus('success');
        if (isAuthenticated) {
          refresh().catch(() => {});
        }
      })
      .catch((err) => {
        if (!active) return;
        if (user?.emailVerified) {
          setStatus('already_verified');
          return;
        }
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resendSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t('auth:validation.emailRequired'))
          .email(t('auth:validation.emailInvalid')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resendSchema),
    mode: 'onTouched',
    defaultValues: { email: user?.email || '' },
  });

  const handleAuthenticatedResend = async () => {
    setResendError('');
    setResendSuccess(false);
    try {
      await resendMutation.mutateAsync({});
      setResendSuccess(true);
      toast.success(t('auth:verifyEmail.resendSuccessToast'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_VERIFIED') {
        setStatus('already_verified');
        refresh().catch(() => {});
        return;
      }
      setResendError(getApiErrorMessage(err, t));
    }
  };

  const handleGuestResend = async (values) => {
    setResendError('');
    setResendSuccess(false);
    try {
      await resendMutation.mutateAsync({ email: values.email.trim() });
      setResendSuccess(true);
      toast.success(t('auth:verifyEmail.resendSuccessToast'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_VERIFIED') {
        setStatus('already_verified');
        return;
      }
      setResendError(getApiErrorMessage(err, t));
    }
  };

  const showResendBlock = status === 'expired' || status === 'invalid' || status === 'missing';

  return (
    <AuthCardShell
      badge={t('auth:verifyEmail.badge')}
      title={t('auth:verifyEmail.title')}
      subtitle={t('auth:verifyEmail.subtitle')}
      headingId="verify-email-heading"
    >
      {status === 'verifying' && (
        <div role="status" aria-live="polite" className="py-8 flex flex-col items-center text-center gap-4">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm font-medium text-on-surface-variant">
            {t('auth:verifyEmail.verifying')}
          </p>
        </div>
      )}

      {(status === 'success' || status === 'already_verified') && (
        <div role="status" aria-live="polite" className="text-center space-y-5 py-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-chip-emerald-bg text-chip-emerald-fg border border-chip-emerald-border flex items-center justify-center">
            <span className="material-symbols-rounded text-[30px]" aria-hidden="true">
              verified
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-on-surface">
              {status === 'already_verified'
                ? t('auth:verifyEmail.alreadyVerifiedTitle')
                : t('auth:verifyEmail.successTitle')}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {status === 'already_verified'
                ? t('auth:verifyEmail.alreadyVerifiedMessage')
                : t('auth:verifyEmail.successMessage')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              to={isAuthenticated ? ROUTES.ACCOUNT : ROUTES.LOGIN}
              variant="primary-gradient"
              size="md"
              className="w-full flex-1"
            >
                {isAuthenticated
                  ? t('auth:verifyEmail.goToAccount')
                  : t('auth:verifyEmail.goToLogin')}
              </Button>
            <Button
              to={ROUTES.PROJECTS}
              variant="outline"
              size="md"
              className="w-full flex-1"
            >
                {t('auth:verifyEmail.browseProjects')}
              </Button>
          </div>
        </div>
      )}

      {showResendBlock && (
        <div className="space-y-5">
          <div role="alert" className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-chip-amber-bg text-chip-amber-fg border border-chip-amber-border flex items-center justify-center">
              <span className="material-symbols-rounded text-[28px]" aria-hidden="true">
                {status === 'expired' ? 'schedule' : 'mark_email_unread'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-on-surface">
              {status === 'expired'
                ? t('auth:verifyEmail.expiredTitle')
                : status === 'missing'
                  ? t('auth:verifyEmail.missingTitle')
                  : t('auth:verifyEmail.invalidTitle')}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {status === 'expired'
                ? t('auth:verifyEmail.expiredMessage')
                : status === 'missing'
                  ? t('auth:verifyEmail.missingMessage')
                  : t('auth:verifyEmail.invalidMessage')}
            </p>
          </div>

          {resendSuccess && (
            <div
              role="status"
              className="rounded-xl border border-chip-emerald-border bg-chip-emerald-bg/60 text-chip-emerald-fg px-4 py-3 text-sm flex items-start gap-2.5"
            >
              <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5" aria-hidden="true">
                check_circle
              </span>
              <span>{t('auth:verifyEmail.resendSuccessMessage')}</span>
            </div>
          )}

          {resendError && (
            <div
              role="alert"
              className="rounded-xl border border-chip-danger-border bg-chip-danger-bg/70 text-chip-danger-fg px-4 py-3 text-sm flex items-start gap-2.5"
            >
              <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5" aria-hidden="true">
                error
              </span>
              <span>{resendError}</span>
            </div>
          )}

          {isAuthenticated ? (
            <div className="space-y-3 pt-1">
              <Button
                type="button"
                variant="primary-gradient"
                size="md"
                loading={resendMutation.isPending}
                onClick={handleAuthenticatedResend}
                className="w-full"
                iconLeading={
                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                    send
                  </span>
                }
              >
                {t('auth:verifyEmail.resendButton')}
              </Button>
              <Button
                to={ROUTES.ACCOUNT}
                variant="outline"
                size="md"
                className="w-full"
              >
                  {t('auth:verifyEmail.goToAccount')}
                </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleGuestResend)} noValidate className="space-y-4 pt-1">
              <FormField
                id="verify-resend-email"
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
                  enterKeyHint="done"
                  required
                  placeholder={t('auth:fields.emailPlaceholder')}
                  disabled={resendMutation.isPending}
                  className="text-start"
                  iconLeading={
                    <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                      alternate_email
                    </span>
                  }
                  {...register('email')}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary-gradient"
                size="md"
                loading={resendMutation.isPending}
                className="w-full"
                iconLeading={
                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                    send
                  </span>
                }
              >
                {t('auth:verifyEmail.resendButton')}
              </Button>
            </form>
          )}
        </div>
      )}
    </AuthCardShell>
  );
}
