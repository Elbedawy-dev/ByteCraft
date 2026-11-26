import React, { forwardRef, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useOwnerLogin } from '../../api/owner/auth';
import { MOTION_TRANSITION } from '../../lib/motion';
import { Button, FormField, Input } from '../../components/ui';

const PasswordInput = forwardRef(function PasswordInput(
  {
    showPassword,
    onTogglePassword,
    toggleLabel,
    disabled = false,
    className = '',
    ...props
  },
  ref
) {
  return (
    <div className="relative flex items-center w-full">
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        className={clsx('ps-12 pe-12 font-mono', className)}
        {...props}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        disabled={disabled}
        aria-pressed={showPassword}
        aria-label={toggleLabel}
        className="absolute end-1 top-1/2 -translate-y-1/2 h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-brand-soft/60 transition-colors duration-300 ease-nexus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={showPassword ? 'hide' : 'show'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={MOTION_TRANSITION}
            className="material-symbols-rounded text-[20px] block"
          >
            {showPassword ? 'visibility_off' : 'visibility'}
          </m.span>
        </AnimatePresence>
      </button>
    </div>
  );
});

export function OwnerLoginForm({ onSuccess }) {
  const { t } = useTranslation(['owner', 'common']);
  const [showPassword, setShowPassword] = useState(false);
  const [formBannerError, setFormBannerError] = useState(null);

  const loginMutation = useOwnerLogin();

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .email(t('owner:login.validation.emailInvalid')),
        password: z
          .string()
          .min(1, t('owner:login.validation.passwordRequired')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isBusy = isSubmitting || loginMutation.isPending;

  const onSubmit = async (values) => {
    setFormBannerError(null);
    try {
      const result = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      });
      onSuccess?.(result);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details?.length) {
          applyApiErrorsToForm(err, setError);
        }
        if (err.isRateLimited || err.status === 429) {
          setFormBannerError({
            type: 'warning',
            message: t('owner:login.rateLimited'),
          });
          return;
        }
        if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
          setFormBannerError({
            type: 'error',
            message: t('owner:login.invalidCredentials'),
          });
          return;
        }
      }
      setFormBannerError({
        type: 'error',
        message: getApiErrorMessage(err, t),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
      aria-labelledby="owner-login-heading"
    >
      {formBannerError && (
        <div
          role="alert"
          data-testid="owner-login-banner-error"
          className={clsx(
            'rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5',
            formBannerError.type === 'warning'
              ? 'bg-warning/10 border-warning/30 text-warning'
              : 'bg-error/10 border-error/30 text-error'
          )}
        >
          <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5">
            {formBannerError.type === 'warning' ? 'hourglass_top' : 'error'}
          </span>
          <span className="leading-relaxed">{formBannerError.message}</span>
        </div>
      )}

      <FormField
        id="owner-email"
        label={t('owner:login.emailLabel')}
        required
        error={errors.email?.message}
      >
        <Input
          type="email"
          dir="ltr"
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="next"
          placeholder={t('owner:login.emailPlaceholder')}
          disabled={isBusy}
          className="ps-11 pe-11"
          iconLeading={
            <span className="material-symbols-rounded text-[20px] text-muted" aria-hidden="true">
              alternate_email
            </span>
          }
          {...register('email')}
        />
      </FormField>

      <FormField
        id="owner-password"
        label={t('owner:login.passwordLabel')}
        required
        error={errors.password?.message}
      >
        <PasswordInput
          dir="ltr"
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder={t('owner:login.passwordPlaceholder')}
          disabled={isBusy}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          toggleLabel={
            showPassword
              ? t('common:actions.hidePassword')
              : t('common:actions.showPassword')
          }
          iconLeading={
            <span className="material-symbols-rounded text-[20px] text-muted" aria-hidden="true">
              lock
            </span>
          }
          {...register('password')}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary-gradient"
        size="lg"
        loading={isBusy}
        disabled={isBusy}
        className="w-full mt-1 font-bold"
        iconTrailing={
          <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100">
            arrow_forward
          </span>
        }
      >
        {isBusy ? t('owner:login.submitting') : t('owner:login.submit')}
      </Button>
    </form>
  );
}
