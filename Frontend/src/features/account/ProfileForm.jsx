import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useUpdateAccountProfile } from '../../api/account';
import { ApiError, applyApiErrorsToForm, getApiErrorMessage } from '../../api/client';
import { useLang, useToast } from '../../app/providers';
import { Badge, Button, Card, FormField, Input, Select } from '../../components/ui';

export function ProfileForm({ user }) {
  const { t } = useTranslation(['account', 'common']);
  const { lang } = useLang();
  const toast = useToast();
  const updateProfileMutation = useUpdateAccountProfile();

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, t('account:validation.nameMin'))
          .max(100, t('account:validation.nameMax')),
        phone: z
          .string()
          .trim()
          .max(30, t('account:validation.phoneMax'))
          .optional()
          .default(''),
        gitProvider: z.enum(['', 'github', 'gitlab']).optional().default(''),
        gitUsername: z
          .string()
          .trim()
          .max(100, t('account:validation.gitUsernameMax'))
          .optional()
          .default(''),
      }),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      gitProvider: user?.gitProvider || '',
      gitUsername: user?.gitUsername || '',
    },
  });

  useEffect(() => {
    reset({
      name: user?.name || '',
      phone: user?.phone || '',
      gitProvider: user?.gitProvider || '',
      gitUsername: user?.gitUsername || '',
    });
  }, [user, reset]);

  const isBusy = isSubmitting || updateProfileMutation.isPending;

  const onSubmit = async (values) => {
    try {
      const cleanedGitUsername = (values.gitUsername || '').trim().replace(/^@+/, '');
      const updated = await updateProfileMutation.mutateAsync({
        name: values.name.trim(),
        phone: (values.phone || '').trim(),
        gitProvider: values.gitProvider || null,
        gitUsername: cleanedGitUsername,
        locale: lang === 'en' ? 'en' : 'ar',
      });
      if (updated) {
        reset({
          name: updated.name || '',
          phone: updated.phone || '',
          gitProvider: updated.gitProvider || '',
          gitUsername: updated.gitUsername || '',
        });
      }
      toast.success(t('account:profile.savedToast'));
    } catch (err) {
      if (err instanceof ApiError) {
        applyApiErrorsToForm(err, setError);
      }
      toast.error(getApiErrorMessage(err, t));
    }
  };

  return (
    <Card variant="panel" padding="md" className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap pb-4 border-b border-outline-variant/70">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
              badge
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              {t('account:profile.title')}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t('account:profile.subtitle')}
            </p>
          </div>
        </div>

        <Badge
          variant={user?.emailVerified ? 'success' : 'warning'}
          size="sm"
          dot
        >
          {user?.emailVerified
            ? t('account:profile.verifiedBadge')
            : t('account:profile.unverifiedBadge')}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email (read-only) */}
          <FormField
            id="account-email"
            label={t('account:profile.emailLabel')}
            hint={t('account:profile.emailHint')}
            className="md:col-span-2"
          >
            <Input
              id="account-email"
              type="email"
              dir="ltr"
              readOnly
              disabled
              value={user?.email || ''}
              className="text-start opacity-80"
              iconLeading={
                <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                  mail
                </span>
              }
            />
          </FormField>

          <FormField
            id="account-name"
            label={t('account:profile.nameLabel')}
            error={errors.name?.message}
            required
          >
            <Input
              id="account-name"
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              disabled={isBusy}
              error={Boolean(errors.name)}
              placeholder={t('account:profile.namePlaceholder')}
              iconLeading={
                <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                  person
                </span>
              }
              {...register('name')}
            />
          </FormField>

          <FormField
            id="account-phone"
            label={t('account:profile.phoneLabel')}
            hint={t('account:profile.phoneHint')}
            error={errors.phone?.message}
          >
            <Input
              id="account-phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              disabled={isBusy}
              error={Boolean(errors.phone)}
              placeholder={t('account:profile.phonePlaceholder')}
              className="text-start"
              iconLeading={
                <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                  call
                </span>
              }
              {...register('phone')}
            />
          </FormField>

          <FormField
            id="account-gitProvider"
            label={t('account:profile.gitProviderLabel')}
            hint={t('account:profile.gitProviderHint')}
            error={errors.gitProvider?.message}
          >
            <Controller
              name="gitProvider"
              control={control}
              render={({ field }) => (
                <Select
                  id="account-gitProvider"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isBusy}
                  error={Boolean(errors.gitProvider)}
                  iconLeading={
                    <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                      code
                    </span>
                  }
                >
                  <option value="">{t('account:profile.gitProviderNone')}</option>
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                </Select>
              )}
            />
          </FormField>

          <FormField
            id="account-gitUsername"
            label={t('account:profile.gitUsernameLabel')}
            hint={t('account:profile.gitUsernameHint')}
            error={errors.gitUsername?.message}
          >
            <Input
              id="account-gitUsername"
              type="text"
              dir="ltr"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              disabled={isBusy}
              error={Boolean(errors.gitUsername)}
              placeholder={t('account:profile.gitUsernamePlaceholder')}
              className="text-start"
              iconLeading={
                <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                  alternate_email
                </span>
              }
              {...register('gitUsername')}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary-gradient"
            size="md"
            loading={isBusy}
            disabled={isBusy || !isDirty}
          >
            {isBusy ? t('account:profile.saving') : t('account:profile.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
