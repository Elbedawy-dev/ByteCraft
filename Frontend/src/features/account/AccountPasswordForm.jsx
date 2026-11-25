import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useChangeAccountPassword } from '../../api/account';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useToast } from '../../app/providers';
import { Button, Card, FormField } from '../../components/ui';
import {
  getPasswordChecks,
  getUtf8ByteLength,
  PasswordChecklist,
  PasswordInput,
} from '../auth';

export function AccountPasswordForm() {
  const { t } = useTranslation(['account', 'auth', 'common']);
  const toast = useToast();
  const changePasswordMutation = useChangeAccountPassword();
  const [formError, setFormError] = useState('');

  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(1, t('account:validation.currentPasswordRequired')),
          newPassword: z
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
        .refine((data) => data.newPassword === data.confirmPassword, {
          path: ['confirmPassword'],
          message: t('auth:validation.passwordsMismatch'),
        }),
    [t]
  );

  const {
    register,
    watch,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedNewPassword = watch('newPassword');
  const isBusy = isSubmitting || changePasswordMutation.isPending;

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success(t('account:password.savedToast'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CURRENT_PASSWORD') {
        const msg = t('common:errors.codes.INVALID_CURRENT_PASSWORD');
        setError('currentPassword', { type: 'server', message: msg });
        return;
      }
      if (err instanceof ApiError) {
        applyApiErrorsToForm(err, setError);
      }
      const msg = getApiErrorMessage(err, t);
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <Card variant="panel" padding="md" className="space-y-6">
      <div className="flex items-start gap-3 pb-4 border-b border-outline-variant/70">
        <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
          <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
            lock_reset
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            {t('account:password.title')}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t('account:password.subtitle')}
          </p>
        </div>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-sm text-error flex items-start gap-2.5"
        >
          <span className="material-symbols-rounded text-[19px] shrink-0 mt-0.5" aria-hidden="true">
            error
          </span>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField
          id="account-currentPassword"
          label={t('account:password.currentLabel')}
          error={errors.currentPassword?.message}
          required
        >
          <PasswordInput
            id="account-currentPassword"
            autoComplete="current-password"
            enterKeyHint="next"
            disabled={isBusy}
            error={Boolean(errors.currentPassword)}
            placeholder={t('account:password.currentPlaceholder')}
            {...register('currentPassword')}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <div className="space-y-2.5">
            <FormField
              id="account-newPassword"
              label={t('account:password.newLabel')}
              error={errors.newPassword?.message}
              required
            >
              <PasswordInput
                id="account-newPassword"
                autoComplete="new-password"
                enterKeyHint="next"
                disabled={isBusy}
                error={Boolean(errors.newPassword)}
                placeholder={t('account:password.newPlaceholder')}
                {...register('newPassword')}
              />
            </FormField>
            <PasswordChecklist password={watchedNewPassword} />
          </div>

          <FormField
            id="account-confirmPassword"
            label={t('account:password.confirmLabel')}
            error={errors.confirmPassword?.message}
            required
          >
            <PasswordInput
              id="account-confirmPassword"
              autoComplete="new-password"
              enterKeyHint="done"
              disabled={isBusy}
              error={Boolean(errors.confirmPassword)}
              placeholder={t('account:password.confirmPlaceholder')}
              {...register('confirmPassword')}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="secondary"
            size="md"
            loading={isBusy}
            disabled={isBusy}
          >
            {isBusy ? t('account:password.saving') : t('account:password.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
