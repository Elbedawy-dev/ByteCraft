import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  applyApiErrorsToForm,
  getApiErrorMessage,
} from '../../api/client';
import { useUpdateOwnerSettings } from '../../api/owner/settings';
import { useToast } from '../../app/providers';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FormField,
  Input,
  Switch,
  Textarea,
} from '../../components/ui';
import {
  createSettingsSchema,
  mapSettingsToFormValues,
} from './settingsSchema';

export function SettingsForm({ settings, onDirtyChange }) {
  const { t } = useTranslation(['ownerSettings', 'owner', 'common']);
  const toast = useToast();
  const updateMutation = useUpdateOwnerSettings();

  const schema = useMemo(
    () => createSettingsSchema((key) => t(`ownerSettings:${key}`)),
    [t]
  );

  const initialValues = useMemo(
    () => mapSettingsToFormValues(settings),
    [settings]
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
    defaultValues: initialValues,
  });

  // Sync form when server settings refresh (only if not actively dirty or on initial load)
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Guard 1: Browser tab close / reload
  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Guard 2: In-app React Router navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const isBusy = isSubmitting || updateMutation.isPending;

  const onSubmit = async (values) => {
    try {
      const updated = await updateMutation.mutateAsync(values);
      const nextFormValues = mapSettingsToFormValues(updated || values);
      reset(nextFormValues);
      toast.success(t('ownerSettings:toasts.settingsSaved'));
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details?.length) {
        applyApiErrorsToForm(err, setError);
      }
      toast.error(getApiErrorMessage(err, t));
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
        aria-label={t('ownerSettings:title')}
      >
        {/* Unsaved Changes Banner */}
        {isDirty && (
          <div
            role="status"
            className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 text-sm font-medium text-warning">
              <span className="material-symbols-outlined text-[20px]">
                edit_notifications
              </span>
              <span>{t('ownerSettings:unsavedBadge')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={() => reset(initialValues)}
              >
                {t('ownerSettings:actions.discard')}
              </Button>
              <Button
                type="submit"
                variant="primary-gradient"
                size="sm"
                loading={isBusy}
                disabled={isBusy}
              >
                {isBusy
                  ? t('ownerSettings:actions.saving')
                  : t('ownerSettings:actions.saveSettings')}
              </Button>
            </div>
          </div>
        )}

        {/* Section 1: General Settings (Site Name + Guarantee Days, tax-free) */}
        <Card variant="flat" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-outline-variant/60">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  tune
                </span>
                <span>{t('ownerSettings:sections.general.title')}</span>
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {t('ownerSettings:sections.general.description')}
              </p>
            </div>
            <Badge variant="primary" size="sm" dot>
              {t('ownerSettings:sections.general.taxFreeBadge')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              id="settings-siteName"
              label={t('ownerSettings:sections.general.siteNameLabel')}
              required
              error={errors.siteName?.message}
            >
              <Input
                type="text"
                placeholder={t(
                  'ownerSettings:sections.general.siteNamePlaceholder'
                )}
                disabled={isBusy}
                {...register('siteName')}
              />
            </FormField>

            <FormField
              id="settings-guaranteeDays"
              label={t('ownerSettings:sections.general.guaranteeDaysLabel')}
              hint={t('ownerSettings:sections.general.guaranteeDaysHint')}
              required
              error={errors.guaranteeDays?.message}
            >
              <Input
                type="number"
                dir="ltr"
                min={0}
                step={1}
                inputMode="numeric"
                disabled={isBusy}
                {...register('guaranteeDays')}
              />
            </FormField>
          </div>
        </Card>

        {/* Section 2: Contact Info & Socials */}
        <Card variant="flat" className="space-y-6">
          <div className="pb-4 border-b border-outline-variant/60">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                contact_mail
              </span>
              <span>{t('ownerSettings:sections.contact.title')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t('ownerSettings:sections.contact.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormField
              id="settings-contact-email"
              label={t('ownerSettings:sections.contact.emailLabel')}
              error={errors.contact?.email?.message}
            >
              <Input
                type="email"
                dir="ltr"
                spellCheck={false}
                autoCapitalize="none"
                placeholder={t(
                  'ownerSettings:sections.contact.emailPlaceholder'
                )}
                disabled={isBusy}
                className="ps-11 pe-11"
                iconLeading={
                  <span className="material-symbols-outlined text-[18px]">
                    mail
                  </span>
                }
                {...register('contact.email')}
              />
            </FormField>

            <FormField
              id="settings-contact-whatsapp"
              label={t('ownerSettings:sections.contact.whatsappLabel')}
              error={errors.contact?.whatsapp?.message}
            >
              <Input
                type="tel"
                dir="ltr"
                placeholder={t(
                  'ownerSettings:sections.contact.whatsappPlaceholder'
                )}
                disabled={isBusy}
                className="ps-11 pe-11"
                iconLeading={
                  <span className="material-symbols-outlined text-[18px]">
                    chat
                  </span>
                }
                {...register('contact.whatsapp')}
              />
            </FormField>

            <FormField
              id="settings-contact-phone"
              label={t('ownerSettings:sections.contact.phoneLabel')}
              error={errors.contact?.phone?.message}
            >
              <Input
                type="tel"
                dir="ltr"
                placeholder={t(
                  'ownerSettings:sections.contact.phonePlaceholder'
                )}
                disabled={isBusy}
                className="ps-11 pe-11"
                iconLeading={
                  <span className="material-symbols-outlined text-[18px]">
                    call
                  </span>
                }
                {...register('contact.phone')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              id="settings-location-ar"
              label={t('ownerSettings:sections.contact.locationArLabel')}
              error={errors.contact?.location?.ar?.message}
            >
              <Input
                type="text"
                dir="rtl"
                placeholder={t(
                  'ownerSettings:sections.contact.locationArPlaceholder'
                )}
                disabled={isBusy}
                {...register('contact.location.ar')}
              />
            </FormField>

            <FormField
              id="settings-location-en"
              label={t('ownerSettings:sections.contact.locationEnLabel')}
              error={errors.contact?.location?.en?.message}
            >
              <Input
                type="text"
                dir="ltr"
                placeholder={t(
                  'ownerSettings:sections.contact.locationEnPlaceholder'
                )}
                disabled={isBusy}
                {...register('contact.location.en')}
              />
            </FormField>
          </div>

          <div className="pt-2 space-y-4">
            <h3 className="text-sm font-semibold text-on-surface">
              {t('ownerSettings:sections.contact.socialsTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                id="settings-social-github"
                label={t('ownerSettings:sections.contact.githubLabel')}
                error={errors.contact?.socials?.github?.message}
              >
                <Input
                  type="url"
                  dir="ltr"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder={t(
                    'ownerSettings:sections.contact.githubPlaceholder'
                  )}
                  disabled={isBusy}
                  className="ps-11 pe-11"
                  iconLeading={
                    <span className="material-symbols-outlined text-[18px]">
                      code
                    </span>
                  }
                  {...register('contact.socials.github')}
                />
              </FormField>

              <FormField
                id="settings-social-linkedin"
                label={t('ownerSettings:sections.contact.linkedinLabel')}
                error={errors.contact?.socials?.linkedin?.message}
              >
                <Input
                  type="url"
                  dir="ltr"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder={t(
                    'ownerSettings:sections.contact.linkedinPlaceholder'
                  )}
                  disabled={isBusy}
                  className="ps-11 pe-11"
                  iconLeading={
                    <span className="material-symbols-outlined text-[18px]">
                      work
                    </span>
                  }
                  {...register('contact.socials.linkedin')}
                />
              </FormField>

              <FormField
                id="settings-social-twitter"
                label={t('ownerSettings:sections.contact.twitterLabel')}
                error={errors.contact?.socials?.twitter?.message}
              >
                <Input
                  type="url"
                  dir="ltr"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder={t(
                    'ownerSettings:sections.contact.twitterPlaceholder'
                  )}
                  disabled={isBusy}
                  className="ps-11 pe-11"
                  iconLeading={
                    <span className="material-symbols-outlined text-[18px]">
                      alternate_email
                    </span>
                  }
                  {...register('contact.socials.twitter')}
                />
              </FormField>

              <FormField
                id="settings-social-facebook"
                label={t('ownerSettings:sections.contact.facebookLabel')}
                error={errors.contact?.socials?.facebook?.message}
              >
                <Input
                  type="url"
                  dir="ltr"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder={t(
                    'ownerSettings:sections.contact.facebookPlaceholder'
                  )}
                  disabled={isBusy}
                  className="ps-11 pe-11"
                  iconLeading={
                    <span className="material-symbols-outlined text-[18px]">
                      public
                    </span>
                  }
                  {...register('contact.socials.facebook')}
                />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Section 3: Payment Methods */}
        <Card variant="flat" className="space-y-6">
          <div className="pb-4 border-b border-outline-variant/60">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                payments
              </span>
              <span>{t('ownerSettings:sections.payments.title')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t('ownerSettings:sections.payments.description')}
            </p>
          </div>

          {/* 3.1 Vodafone Cash */}
          <div className="rounded-xl bg-surface-container border border-outline-variant/80 p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface">
                  {t('ownerSettings:sections.payments.vodafone.title')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {t('ownerSettings:sections.payments.vodafone.description')}
                </p>
              </div>
              <Controller
                name="paymentMethods.vodafone_cash.enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="settings-pm-vodafone-enabled"
                    label={t(
                      'ownerSettings:sections.payments.vodafone.enabledLabel'
                    )}
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isBusy}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                id="settings-vf-walletNumber"
                label={t(
                  'ownerSettings:sections.payments.vodafone.walletNumberLabel'
                )}
                error={
                  errors.paymentMethods?.vodafone_cash?.walletNumber?.message
                }
              >
                <Input
                  type="text"
                  dir="ltr"
                  inputMode="tel"
                  placeholder={t(
                    'ownerSettings:sections.payments.vodafone.walletNumberPlaceholder'
                  )}
                  disabled={isBusy}
                  {...register('paymentMethods.vodafone_cash.walletNumber')}
                />
              </FormField>

              <FormField
                id="settings-vf-accountName"
                label={t(
                  'ownerSettings:sections.payments.vodafone.accountNameLabel'
                )}
                error={
                  errors.paymentMethods?.vodafone_cash?.accountName?.message
                }
              >
                <Input
                  type="text"
                  placeholder={t(
                    'ownerSettings:sections.payments.vodafone.accountNamePlaceholder'
                  )}
                  disabled={isBusy}
                  {...register('paymentMethods.vodafone_cash.accountName')}
                />
              </FormField>

              <FormField
                id="settings-vf-instructions-ar"
                label={t(
                  'ownerSettings:sections.payments.vodafone.instructionsArLabel'
                )}
                error={
                  errors.paymentMethods?.vodafone_cash?.instructions?.ar
                    ?.message
                }
              >
                <Textarea
                  dir="rtl"
                  rows={3}
                  disabled={isBusy}
                  {...register('paymentMethods.vodafone_cash.instructions.ar')}
                />
              </FormField>

              <FormField
                id="settings-vf-instructions-en"
                label={t(
                  'ownerSettings:sections.payments.vodafone.instructionsEnLabel'
                )}
                error={
                  errors.paymentMethods?.vodafone_cash?.instructions?.en
                    ?.message
                }
              >
                <Textarea
                  dir="ltr"
                  rows={3}
                  disabled={isBusy}
                  {...register('paymentMethods.vodafone_cash.instructions.en')}
                />
              </FormField>
            </div>
          </div>

          {/* 3.2 InstaPay */}
          <div className="rounded-xl bg-surface-container border border-outline-variant/80 p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface">
                  {t('ownerSettings:sections.payments.instapay.title')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {t('ownerSettings:sections.payments.instapay.description')}
                </p>
              </div>
              <Controller
                name="paymentMethods.instapay.enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="settings-pm-instapay-enabled"
                    label={t(
                      'ownerSettings:sections.payments.instapay.enabledLabel'
                    )}
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isBusy}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                id="settings-ip-ipa"
                label={t('ownerSettings:sections.payments.instapay.ipaLabel')}
                error={errors.paymentMethods?.instapay?.ipa?.message}
              >
                <Input
                  type="text"
                  dir="ltr"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder={t(
                    'ownerSettings:sections.payments.instapay.ipaPlaceholder'
                  )}
                  disabled={isBusy}
                  {...register('paymentMethods.instapay.ipa')}
                />
              </FormField>

              <FormField
                id="settings-ip-accountName"
                label={t(
                  'ownerSettings:sections.payments.instapay.accountNameLabel'
                )}
                error={errors.paymentMethods?.instapay?.accountName?.message}
              >
                <Input
                  type="text"
                  placeholder={t(
                    'ownerSettings:sections.payments.instapay.accountNamePlaceholder'
                  )}
                  disabled={isBusy}
                  {...register('paymentMethods.instapay.accountName')}
                />
              </FormField>

              <FormField
                id="settings-ip-instructions-ar"
                label={t(
                  'ownerSettings:sections.payments.instapay.instructionsArLabel'
                )}
                error={
                  errors.paymentMethods?.instapay?.instructions?.ar?.message
                }
              >
                <Textarea
                  dir="rtl"
                  rows={3}
                  disabled={isBusy}
                  {...register('paymentMethods.instapay.instructions.ar')}
                />
              </FormField>

              <FormField
                id="settings-ip-instructions-en"
                label={t(
                  'ownerSettings:sections.payments.instapay.instructionsEnLabel'
                )}
                error={
                  errors.paymentMethods?.instapay?.instructions?.en?.message
                }
              >
                <Textarea
                  dir="ltr"
                  rows={3}
                  disabled={isBusy}
                  {...register('paymentMethods.instapay.instructions.en')}
                />
              </FormField>
            </div>
          </div>

          {/* 3.3 Fawry & Card (Paymob server keys note) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Fawry */}
            <div className="rounded-xl bg-surface-container border border-outline-variant/80 p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {t('ownerSettings:sections.payments.fawry.title')}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t('ownerSettings:sections.payments.fawry.description')}
                    </p>
                  </div>
                </div>

                <Controller
                  name="paymentMethods.fawry.enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="settings-pm-fawry-enabled"
                      label={t(
                        'ownerSettings:sections.payments.fawry.enabledLabel'
                      )}
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isBusy}
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 px-3 py-2.5 flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                  info
                </span>
                <span>
                  {t('ownerSettings:sections.payments.fawry.serverNote')}
                </span>
              </div>
            </div>

            {/* Bank Card */}
            <div className="rounded-xl bg-surface-container border border-outline-variant/80 p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {t('ownerSettings:sections.payments.card.title')}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t('ownerSettings:sections.payments.card.description')}
                    </p>
                  </div>
                </div>

                <Controller
                  name="paymentMethods.card.enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="settings-pm-card-enabled"
                      label={t(
                        'ownerSettings:sections.payments.card.enabledLabel'
                      )}
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isBusy}
                      className="w-full"
                    />
                  )}
                />
              </div>

              <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 px-3 py-2.5 flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                  info
                </span>
                <span>
                  {t('ownerSettings:sections.payments.card.serverNote')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom Save Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isBusy}
              onClick={() => reset(initialValues)}
            >
              {t('ownerSettings:actions.discard')}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary-gradient"
            size="md"
            loading={isBusy}
            disabled={isBusy || !isDirty}
            iconLeading={
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
            }
          >
            {isBusy
              ? t('ownerSettings:actions.saving')
              : t('ownerSettings:actions.saveSettings')}
          </Button>
        </div>
      </form>

      {/* Unsaved Changes Confirmation Dialog on Route Navigation */}
      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title={t('owner:unsaved.title')}
        message={t('owner:unsaved.message')}
        cancelText={t('owner:unsaved.stay')}
        confirmText={t('owner:unsaved.discardAndLeave')}
        variant="danger"
      />
    </>
  );
}
