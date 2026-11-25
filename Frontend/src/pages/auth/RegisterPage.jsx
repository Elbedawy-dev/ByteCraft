import React, { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useMeta } from '../../api/meta';
import { ROUTES } from '../../config/routes';
import { useLang, useToast } from '../../app/providers';
import { Button, FormField, Input, Spinner } from '../../components/ui';
import { AuthCardShell } from '../../features/auth/AuthCardShell';
import { PasswordInput } from '../../features/auth/PasswordInput';
import { PasswordChecklist } from '../../features/auth/PasswordChecklist';
import { getPasswordChecks, getUtf8ByteLength } from '../../features/auth/passwordValidation';
import { useAuth } from '../../features/auth/useAuth';

export default function RegisterPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { lang } = useLang();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isAdmin, isLoading, register: registerAccount } = useAuth();
  const { data: meta } = useMeta();

  const justSubmittedRef = useRef(false);
  const [bannerError, setBannerError] = useState(null);
  const [registrationBlockedByApi, setRegistrationBlockedByApi] = useState(false);

  const isRegistrationDisabled =
    meta?.registrationEnabled === false || registrationBlockedByApi;

  const schema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(2, t('auth:validation.nameMin'))
            .max(100, t('auth:validation.nameMax')),
          email: z
            .string()
            .trim()
            .min(1, t('auth:validation.emailRequired'))
            .email(t('auth:validation.emailInvalid')),
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
          phone: z
            .string()
            .trim()
            .max(30, t('auth:validation.phoneMax'))
            .optional()
            .default(''),
        })
        .refine(
          (data) =>
            !data.email ||
            data.password.trim().toLowerCase() !== data.email.trim().toLowerCase(),
          {
            path: ['password'],
            message: t('auth:validation.passwordNotEmail'),
          }
        ),
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
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const watchedPassword = watch('password');

  if (isLoading) {
    return (
      <AuthCardShell title={t('auth:register.title')} subtitle={t('auth:register.subtitle')}>
        <div className="py-10 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-muted">{t('auth:common.verifyingSession')}</p>
        </div>
      </AuthCardShell>
    );
  }

  if (isAuthenticated && !justSubmittedRef.current) {
    return (
      <Navigate
        to={isAdmin ? ROUTES.OWNER_DASHBOARD : ROUTES.ACCOUNT}
        replace
      />
    );
  }

  const onSubmit = async (values) => {
    setBannerError(null);
    try {
      justSubmittedRef.current = true;
      await registerAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone ? values.phone.trim() : '',
        locale: lang === 'en' ? 'en' : 'ar',
      });
      toast.success(t('auth:register.successToast'));
      navigate(ROUTES.ACCOUNT, {
        replace: true,
        state: { justRegistered: true },
      });
    } catch (err) {
      justSubmittedRef.current = false;
      if (err instanceof ApiError) {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setRegistrationBlockedByApi(true);
          setBannerError({
            type: 'warning',
            icon: 'person_off',
            message: t('auth:register.errors.disabled'),
          });
          return;
        }
        if (err.status === 409 || err.code === 'CONFLICT') {
          setError('email', {
            type: 'server',
            message: t('auth:register.errors.emailExists'),
          });
          setBannerError({
            type: 'error',
            icon: 'error',
            message: t('auth:register.errors.emailExists'),
          });
          return;
        }
        if (err.isRateLimited || err.status === 429) {
          setBannerError({
            type: 'warning',
            icon: 'hourglass_top',
            message: t('auth:register.errors.rateLimited'),
          });
          return;
        }
        if (err.status === 400 && err.details?.length) {
          const mapped = applyApiErrorsToForm(err, setError);
          if (mapped) return;
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
      badge={t('auth:register.badge')}
      title={t('auth:register.title')}
      subtitle={t('auth:register.subtitle')}
      headingId="register-page-heading"
      footer={
        <p>
          {t('auth:register.hasAccount')}{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-bold text-primary hover:underline underline-offset-4"
          >
            {t('auth:register.loginLink')}
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
        aria-labelledby="register-page-heading"
      >
        {isRegistrationDisabled && (
          <div
            role="alert"
            className="rounded-xl border border-chip-amber-border bg-chip-amber-bg/70 text-chip-amber-fg px-4 py-3.5 text-sm flex items-start gap-2.5"
          >
            <span className="material-symbols-rounded text-[20px] shrink-0 mt-0.5" aria-hidden="true">
              person_off
            </span>
            <div className="space-y-1">
              <p className="font-bold">{t('auth:register.disabledTitle')}</p>
              <p className="leading-relaxed text-xs sm:text-sm">
                {t('auth:register.errors.disabled')}
              </p>
            </div>
          </div>
        )}

        {bannerError && !isRegistrationDisabled && (
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
          id="register-name"
          label={t('auth:fields.nameLabel')}
          required
          error={errors.name?.message}
        >
          <Input
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            required
            placeholder={t('auth:fields.namePlaceholder')}
            disabled={isSubmitting || isRegistrationDisabled}
            iconLeading={
              <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                person
              </span>
            }
            {...register('name')}
          />
        </FormField>

        <FormField
          id="register-email"
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
            disabled={isSubmitting || isRegistrationDisabled}
            className="text-start"
            iconLeading={
              <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                alternate_email
              </span>
            }
            {...register('email')}
          />
        </FormField>

        <div>
          <FormField
            id="register-password"
            label={t('auth:fields.passwordLabel')}
            required
            error={errors.password?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              enterKeyHint="next"
              required
              aria-describedby="register-password-rules"
              placeholder={t('auth:fields.newPasswordPlaceholder')}
              disabled={isSubmitting || isRegistrationDisabled}
              {...register('password')}
            />
          </FormField>
          <PasswordChecklist password={watchedPassword} id="register-password-rules" />
        </div>

        <FormField
          id="register-phone"
          label={t('auth:fields.phoneOptionalLabel')}
          hint={t('auth:fields.phoneHint')}
          error={errors.phone?.message}
        >
          <Input
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="done"
            placeholder={t('auth:fields.phonePlaceholder')}
            disabled={isSubmitting || isRegistrationDisabled}
            className="text-start"
            iconLeading={
              <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
                call
              </span>
            }
            {...register('phone')}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary-gradient"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting || isRegistrationDisabled}
          className="w-full mt-1 font-bold"
          iconTrailing={
            <span className="material-symbols-rounded text-[20px] rtl:-scale-x-100" aria-hidden="true">
              arrow_forward
            </span>
          }
        >
          {isSubmitting ? t('auth:register.submitting') : t('auth:register.submit')}
        </Button>
      </form>
    </AuthCardShell>
  );
}
