import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { FormField, HoneypotField, Input } from '@/components/ui';

const GIT_PROVIDERS = [
  { key: 'github', icon: 'code' },
  { key: 'gitlab', icon: 'merge_type' },
];

/**
 * Customer identity & Git delivery details section.
 */
export function CustomerInfoSection({ register, errors, watch, disabled = false }) {
  const { t } = useTranslation('checkout');
  const selectedProvider = watch('gitProvider');

  return (
    <section
      aria-labelledby="checkout-customer-heading"
      className="relative overflow-hidden bg-surface-container-low border border-outline-variant rounded-xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-primary shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            badge
          </span>
        </div>
        <div className="min-w-0">
          <h2
            id="checkout-customer-heading"
            className="font-headline-md text-lg sm:text-xl text-on-surface font-bold"
          >
            {t('customer.title')}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            {t('customer.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          id="checkout-fullName"
          label={t('customer.fullNameLabel')}
          hint={t('customer.fullNameHint')}
          error={errors.fullName?.message}
          required
          className="md:col-span-2"
        >
          <Input
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            disabled={disabled}
            placeholder={t('customer.fullNamePlaceholder')}
            className="placeholder:text-outline"
            iconLeading={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                person
              </span>
            }
            {...register('fullName')}
          />
        </FormField>

        <FormField
          id="checkout-email"
          label={t('customer.emailLabel')}
          hint={t('customer.emailHint')}
          error={errors.email?.message}
          required
        >
          <Input
            type="email"
            dir="ltr"
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            disabled={disabled}
            placeholder={t('customer.emailPlaceholder')}
            className="placeholder:text-outline text-start"
            iconLeading={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                mail
              </span>
            }
            {...register('email')}
          />
        </FormField>

        <FormField
          id="checkout-phone"
          label={t('customer.phoneLabel')}
          hint={t('customer.phoneHint')}
          error={errors.phone?.message}
          required
        >
          <Input
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            disabled={disabled}
            placeholder={t('customer.phonePlaceholder')}
            className="placeholder:text-outline text-start"
            iconLeading={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                call
              </span>
            }
            {...register('phone')}
          />
        </FormField>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-on-surface mb-2 flex items-center gap-1 select-none">
            <span>{t('customer.gitProviderLabel')}</span>
            <span className="text-primary font-bold text-base leading-none" aria-hidden="true">
              *
            </span>
          </span>
          <fieldset
            id="checkout-gitProvider"
            className="border-0 p-0 m-0"
            disabled={disabled}
            aria-describedby={
              errors.gitProvider?.message
                ? 'checkout-gitProvider-error'
                : 'checkout-gitProvider-hint'
            }
          >
            <legend className="sr-only">{t('aria.gitProviderGroup')}</legend>
            <div className="grid grid-cols-2 gap-3">
              {GIT_PROVIDERS.map(({ key, icon }) => {
                const isSelected = selectedProvider === key;
                const radioId = `checkout-gitProvider-${key}`;
                return (
                  <label
                    key={key}
                    htmlFor={radioId}
                    className={clsx(
                      'relative flex items-center justify-center gap-2 h-12 px-3 rounded-lg border text-sm font-semibold cursor-pointer select-none transition-all duration-150',
                      'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface',
                      isSelected
                        ? 'bg-surface-container border-primary text-primary shadow-sm'
                        : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface',
                      disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <input
                      id={radioId}
                      type="radio"
                      value={key}
                      className="sr-only"
                      {...register('gitProvider')}
                    />
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      {icon}
                    </span>
                    <bdi dir="ltr">{t(`customer.providers.${key}`)}</bdi>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <p id="checkout-gitProvider-hint" className="text-xs text-on-surface-variant mt-2">
            {t('customer.gitProviderHint')}
          </p>
          {errors.gitProvider?.message && (
            <p id="checkout-gitProvider-error" role="alert" className="text-xs text-error mt-1">
              {errors.gitProvider.message}
            </p>
          )}
        </div>

        <FormField
          id="checkout-gitUsername"
          label={t('customer.gitUsernameLabel')}
          hint={t('customer.gitUsernameHint')}
          error={errors.gitUsername?.message}
          required
        >
          <Input
            type="text"
            dir="ltr"
            autoComplete="username"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            disabled={disabled}
            placeholder={t('customer.gitUsernamePlaceholder')}
            className="placeholder:text-outline text-start"
            iconLeading={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                alternate_email
              </span>
            }
            {...register('gitUsername')}
          />
        </FormField>

        <FormField
          id="checkout-organization"
          label={t('customer.organizationLabel')}
          error={errors.organization?.message}
          className="md:col-span-2"
        >
          <Input
            type="text"
            autoComplete="organization"
            enterKeyHint="done"
            disabled={disabled}
            placeholder={t('customer.organizationPlaceholder')}
            className="placeholder:text-outline"
            iconLeading={
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                apartment
              </span>
            }
            {...register('organization')}
          />
        </FormField>
      </div>

      <div className="relative w-0 h-0 overflow-hidden" aria-hidden="true">
        <HoneypotField register={register} />
      </div>
    </section>
  );
}
