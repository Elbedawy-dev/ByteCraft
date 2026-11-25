import React, { forwardRef, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import {
  ApiError,
  applyApiErrorsToForm,
  getApiErrorMessage,
} from '../../api/client';
import { useChangeOwnerPassword } from '../../api/owner/auth';
import { useToast } from '../../app/providers';
import { MOTION_TRANSITION } from '../../lib/motion';
import { Button, Card, FormField, Input } from '../../components/ui';
import { createChangePasswordSchema } from './settingsSchema';

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
        className="absolute end-1 top-1/2 -translate-y-1/2 h-10 w-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/70 transition-colors duration-300 ease-nexus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={showPassword ? 'hide' : 'show'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={MOTION_TRANSITION}
            className="material-symbols-outlined text-[18px] block"
          >
            {showPassword ? 'visibility_off' : 'visibility'}
          </m.span>
        </AnimatePresence>
      </button>
    </div>
  );
});

export function ChangePasswordForm() {
  const { t } = useTranslation(['ownerSettings', 'common']);
  const toast = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const changePasswordMutation = useChangeOwnerPassword();

  const schema = useMemo(
    () => createChangePasswordSchema((key) => t(`ownerSettings:${key}`)),
    [t]
  );

  const {
    register,
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
    },
  });

  const isBusy = isSubmitting || changePasswordMutation.isPending;

  const onSubmit = async (values) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success(t('ownerSettings:toasts.passwordUpdated'));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CURRENT_PASSWORD') {
          setError('currentPassword', {
            type: 'server',
            message: t('common:errors.codes.INVALID_CURRENT_PASSWORD'),
          });
          return;
        }
        if (err.status === 400 && err.details?.length) {
          applyApiErrorsToForm(err, setError);
        }
      }
      toast.error(getApiErrorMessage(err, t));
    }
  };

  return (
    <Card variant="flat" className="space-y-5">
      <div className="pb-4 border-b border-outline-variant/60">
        <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            shield_lock
          </span>
          <span>{t('ownerSettings:sections.security.title')}</span>
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          {t('ownerSettings:sections.security.description')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
        aria-label={t('ownerSettings:sections.security.title')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            id="settings-current-password"
            label={t('ownerSettings:sections.security.currentPasswordLabel')}
            required
            error={errors.currentPassword?.message}
          >
            <PasswordInput
              dir="ltr"
              autoComplete="current-password"
              placeholder={t(
                'ownerSettings:sections.security.currentPasswordPlaceholder'
              )}
              disabled={isBusy}
              showPassword={showCurrent}
              onTogglePassword={() => setShowCurrent((prev) => !prev)}
              toggleLabel={
                showCurrent
                  ? t('common:actions.hidePassword')
                  : t('common:actions.showPassword')
              }
              iconLeading={
                <span className="material-symbols-outlined text-[18px]">
                  lock
                </span>
              }
              {...register('currentPassword')}
            />
          </FormField>

          <FormField
            id="settings-new-password"
            label={t('ownerSettings:sections.security.newPasswordLabel')}
            hint={t('ownerSettings:sections.security.newPasswordHint')}
            required
            error={errors.newPassword?.message}
          >
            <PasswordInput
              dir="ltr"
              autoComplete="new-password"
              placeholder={t(
                'ownerSettings:sections.security.newPasswordPlaceholder'
              )}
              disabled={isBusy}
              showPassword={showNew}
              onTogglePassword={() => setShowNew((prev) => !prev)}
              toggleLabel={
                showNew
                  ? t('common:actions.hidePassword')
                  : t('common:actions.showPassword')
              }
              iconLeading={
                <span className="material-symbols-outlined text-[18px]">
                  key
                </span>
              }
              {...register('newPassword')}
            />
          </FormField>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            size="md"
            loading={isBusy}
            disabled={isBusy}
            iconLeading={
              <span className="material-symbols-outlined text-[18px]">
                password
              </span>
            }
          >
            {isBusy
              ? t('ownerSettings:actions.updatingPassword')
              : t('ownerSettings:actions.updatePassword')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
