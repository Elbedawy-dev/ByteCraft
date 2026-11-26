import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ApiError, getApiErrorMessage } from '../../api/client';
import { useForgotPassword } from '../../api/auth';
import { ROUTES } from '../../config/routes';
import { Button, FormField, Input } from '../../components/ui';
import { AuthCardShell } from '../../features/auth/AuthCardShell';

export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  const forgotMutation = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const schema = useMemo(
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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '' },
  });

  const isBusy = isSubmitting || forgotMutation.isPending;

  const onSubmit = async (values) => {
    setBannerError('');
    try {
      await forgotMutation.mutateAsync({ email: values.email.trim() });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && (err.isRateLimited || err.status === 429)) {
        setBannerError(t('auth:forgotPassword.errors.rateLimited'));
        return;
      }
      setBannerError(getApiErrorMessage(err, t));
    }
  };

  return (
    <AuthCardShell
      badge={t('auth:forgotPassword.badge')}
      title={t('auth:forgotPassword.title')}
      subtitle={t('auth:forgotPassword.subtitle')}
      headingId="forgot-password-heading"
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
      {submitted ? (
        <div role="status" aria-live="polite" className="text-center space-y-5 py-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-chip-emerald-bg text-chip-emerald-fg border border-chip-emerald-border flex items-center justify-center">
            <span className="material-symbols-rounded text-[28px]" aria-hidden="true">
              mark_email_read
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-on-surface">
              {t('auth:forgotPassword.successTitle')}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {t('auth:forgotPassword.successMessage')}
            </p>
          </div>
          <Button
            to={ROUTES.LOGIN}
            variant="primary-gradient"
            size="md"
            className="w-full"
          >
              {t('auth:forgotPassword.backToLogin')}
            </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
          aria-labelledby="forgot-password-heading"
        >
          {bannerError && (
            <div
              role="alert"
              className="rounded-xl border border-chip-amber-border bg-chip-amber-bg/70 text-chip-amber-fg px-4 py-3 text-sm flex items-start gap-2.5"
            >
              <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5" aria-hidden="true">
                hourglass_top
              </span>
              <span className="leading-relaxed">{bannerError}</span>
            </div>
          )}

          <FormField
            id="forgot-email"
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
              disabled={isBusy}
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
            size="lg"
            loading={isBusy}
            disabled={isBusy}
            className="w-full font-bold"
          >
            {isBusy ? t('auth:forgotPassword.submitting') : t('auth:forgotPassword.submit')}
          </Button>
        </form>
      )}
    </AuthCardShell>
  );
}
