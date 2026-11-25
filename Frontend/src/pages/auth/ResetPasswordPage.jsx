import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useResetPassword } from '../../api/auth';
import { ROUTES } from '../../config/routes';
import { Button, FormField } from '../../components/ui';
import { AuthCardShell } from '../../features/auth/AuthCardShell';
import { PasswordInput } from '../../features/auth/PasswordInput';
import { PasswordChecklist } from '../../features/auth/PasswordChecklist';
import { getPasswordChecks, getUtf8ByteLength } from '../../features/auth/passwordValidation';

export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const resetMutation = useResetPassword();
  const [success, setSuccess] = useState(false);
  const [invalidTokenError, setInvalidTokenError] = useState(!token);
  const [bannerError, setBannerError] = useState('');

  const schema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(8, t('auth:validation.passwordMin'))
            .refine((val) => getUtf8ByteLength(val) <= 72, {
              message: t('auth:validation.passwordMaxBytes'),
            })
            .refine((val) => getPasswordChecks(val).hasLetter, {
              message: t('auth:validation.passwordLetter'),
            })
            .refine((val) => getPasswordChecks(val).hasNumber, {
              message: t('auth:validation.passwordNumber'),
            }),
          confirmPassword: z
            .string()
            .min(1, t('auth:validation.confirmPasswordRequired')),
        })
        .refine((data) => data.password === data.confirmPassword, {
          path: ['confirmPassword'],
          message: t('auth:validation.passwordsMismatch'),
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');
  const isBusy = isSubmitting || resetMutation.isPending;

  const onSubmit = async (values) => {
    setBannerError('');
    try {
      await resetMutation.mutateAsync({
        token,
        password: values.password,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_TOKEN') {
          setInvalidTokenError(true);
          return;
        }
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setBannerError(t('auth:login.errors.accountDisabled'));
          return;
        }
        if (err.status === 400 && err.details?.length) {
          const mapped = applyApiErrorsToForm(err, setError);
          if (mapped) return;
        }
      }
      setBannerError(getApiErrorMessage(err, t));
    }
  };

  return (
    <AuthCardShell
      badge={t('auth:resetPassword.badge')}
      title={t('auth:resetPassword.title')}
      subtitle={t('auth:resetPassword.subtitle')}
      headingId="reset-password-heading"
      footer={
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline underline-offset-4"
        >
          <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
            arrow_back
          </span>
          <span>{t('auth:forgotPassword.backToLogin')}</span>
        </Link>
      }
    >
      {success ? (
        <div role="status" aria-live="polite" className="text-center space-y-5 py-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-chip-emerald-bg text-chip-emerald-fg border border-chip-emerald-border flex items-center justify-center">
            <span className="material-symbols-rounded text-[28px]" aria-hidden="true">
              check_circle
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-on-surface">
              {t('auth:resetPassword.successTitle')}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t('auth:resetPassword.successMessage')}
            </p>
          </div>
          <Link to={ROUTES.LOGIN} className="block">
            <Button variant="primary-gradient" size="md" className="w-full">
              {t('auth:resetPassword.goToLogin')}
            </Button>
          </Link>
        </div>
      ) : invalidTokenError ? (
        <div role="alert" className="text-center space-y-5 py-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-chip-danger-bg text-chip-danger-fg border border-chip-danger-border flex items-center justify-center">
            <span className="material-symbols-rounded text-[28px]" aria-hidden="true">
              link_off
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-on-surface">
              {t('auth:resetPassword.invalidTokenTitle')}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t('auth:resetPassword.invalidTokenMessage')}
            </p>
          </div>
          <Link to={ROUTES.FORGOT_PASSWORD} className="block">
            <Button variant="primary-gradient" size="md" className="w-full">
              {t('auth:resetPassword.requestNewLink')}
            </Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
          aria-labelledby="reset-password-heading"
        >
          {bannerError && (
            <div
              role="alert"
              className="rounded-xl border border-chip-danger-border bg-chip-danger-bg/70 text-chip-danger-fg px-4 py-3 text-sm flex items-start gap-2.5"
            >
              <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5" aria-hidden="true">
                error
              </span>
              <span className="leading-relaxed">{bannerError}</span>
            </div>
          )}

          <div>
            <FormField
              id="reset-new-password"
              label={t('auth:fields.newPasswordLabel')}
              required
              error={errors.password?.message}
            >
              <PasswordInput
                autoComplete="new-password"
                enterKeyHint="next"
                required
                aria-describedby="reset-password-rules"
                placeholder={t('auth:fields.newPasswordPlaceholder')}
                disabled={isBusy}
                {...register('password')}
              />
            </FormField>
            <PasswordChecklist password={watchedPassword} id="reset-password-rules" />
          </div>

          <FormField
            id="reset-confirm-password"
            label={t('auth:fields.confirmPasswordLabel')}
            required
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              enterKeyHint="done"
              required
              placeholder={t('auth:fields.confirmPasswordPlaceholder')}
              disabled={isBusy}
              iconName="key"
              {...register('confirmPassword')}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary-gradient"
            size="lg"
            loading={isBusy}
            disabled={isBusy}
            className="w-full font-bold"
          >
            {isBusy ? t('auth:resetPassword.submitting') : t('auth:resetPassword.submit')}
          </Button>
        </form>
      )}
    </AuthCardShell>
  );
}
