import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, RadioCard, Skeleton } from '@/components/ui';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { contactPath } from '@/config/routes';
import { PAYMENT_METHOD_ORDER } from './checkoutSchema';

const PAYMENT_METHOD_VISUALS = {
  vodafone_cash: {
    icon: 'phone_iphone',
    badgeVariant: 'primary',
    hasBadge: true,
  },
  instapay: {
    icon: 'bolt',
    badgeVariant: 'primary',
    hasBadge: true,
  },
  fawry: {
    icon: 'local_atm',
    badgeVariant: 'neutral',
    hasBadge: false,
  },
  card: {
    icon: 'credit_card',
    badgeVariant: 'neutral',
    hasBadge: true,
  },
};

/**
 * Payment method selector built exclusively from enabled methods in `useMeta().paymentMethods`.
 * Never invents or displays private wallet numbers / IPAs prior to order creation.
 */
export function PaymentMethodSection({
  paymentMethodsMeta,
  isMetaLoading = false,
  selectedMethod,
  onSelectMethod,
  error,
  isFreeOrder = false,
  gitProvider = 'github',
  supportDays = 30,
  projectSlug,
  disabled = false,
}) {
  const { t } = useTranslation('checkout');
  const { lang } = useLang();

  const enabledKeys = PAYMENT_METHOD_ORDER.filter(
    (key) => Boolean(paymentMethodsMeta?.[key]?.enabled)
  );

  const providerLabel =
    gitProvider === 'gitlab'
      ? t('customer.providers.gitlab')
      : t('customer.providers.github');

  return (
    <section
      aria-labelledby="checkout-payment-heading"
      className="bg-card border border-card-border rounded-xl p-5 sm:p-6 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-badge-green-bg border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              account_balance_wallet
            </span>
          </div>
          <div className="min-w-0">
            <h2
              id="checkout-payment-heading"
              className="font-headline-md text-lg sm:text-xl text-on-surface font-bold"
            >
              {t('payment.title')}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {t('payment.subtitle')}
            </p>
          </div>
        </div>

        <Badge variant="primary" size="md" className="font-code">
          <bdi dir="ltr">{t('payment.currencyBadge')}</bdi>
        </Badge>
      </div>

      {isFreeOrder ? (
        <div
          className="p-4 sm:p-5 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3"
          role="status"
        >
          <span
            className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5"
            aria-hidden="true"
          >
            celebration
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base text-on-surface">
              {t('payment.freeOrderTitle')}
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
              {t('payment.freeOrderDescription')}
            </p>
          </div>
        </div>
      ) : isMetaLoading && !paymentMethodsMeta ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : enabledKeys.length === 0 ? (
        <div
          className="p-5 rounded-xl border border-chip-amber-border bg-chip-amber-bg/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          role="alert"
        >
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="material-symbols-outlined text-warning text-[22px] shrink-0 mt-0.5"
              aria-hidden="true"
            >
              warning
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base text-on-surface">
                {t('payment.noMethodsTitle')}
              </p>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                {t('payment.noMethodsDescription')}
              </p>
            </div>
          </div>
          <Link to={contactPath({ project: projectSlug })} className="shrink-0">
            <Button variant="outline" size="sm">
              {t('payment.contactSupportAction')}
            </Button>
          </Link>
        </div>
      ) : (
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-3" disabled={disabled}>
          <legend className="sr-only">{t('aria.paymentMethodGroup')}</legend>

          {enabledKeys.map((methodKey) => {
            const isSelected = selectedMethod === methodKey;
            const visual = PAYMENT_METHOD_VISUALS[methodKey] || {
              icon: 'payments',
              badgeVariant: 'neutral',
              hasBadge: false,
            };
            const serverInstructions = localized(
              paymentMethodsMeta?.[methodKey]?.instructions,
              lang
            );

            return (
              <RadioCard
                key={methodKey}
                name="paymentMethod"
                value={methodKey}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onSelectMethod(methodKey)}
                header={t(`payment.methods.${methodKey}.title`)}
                description={t(`payment.methods.${methodKey}.description`)}
                badge={
                  visual.hasBadge ? (
                    <Badge variant={visual.badgeVariant} size="sm">
                      {t(`payment.methods.${methodKey}.badge`)}
                    </Badge>
                  ) : null
                }
                price={
                  <span
                    className={
                      isSelected
                        ? 'material-symbols-outlined text-[22px] text-primary'
                        : 'material-symbols-outlined text-[22px] text-on-surface-variant'
                    }
                    aria-hidden="true"
                  >
                    {visual.icon}
                  </span>
                }
              >
                {isSelected && (
                  <div className="mt-3 p-3 rounded-lg bg-surface border border-card-border flex items-start gap-2.5 text-xs sm:text-[13px] text-on-surface-variant leading-relaxed">
                    <span
                      className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      info
                    </span>
                    <div className="space-y-1 min-w-0">
                      {serverInstructions && (
                        <p className="text-on-surface font-medium">{serverInstructions}</p>
                      )}
                      <p>{t(`payment.methods.${methodKey}.nextStepNote`)}</p>
                    </div>
                  </div>
                )}
              </RadioCard>
            );
          })}
        </fieldset>
      )}

      {error && !isFreeOrder && (
        <p
          role="alert"
          className="text-xs sm:text-[13px] text-error mt-3 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0" aria-hidden="true">
            error
          </span>
          <span>{error}</span>
        </p>
      )}

      {/* Delivery & Support Explanation Block */}
      <div className="mt-5 p-4 rounded-xl bg-surface border border-card-border flex items-start gap-3">
        <span
          className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5"
          aria-hidden="true"
        >
          terminal
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-xs sm:text-sm text-on-surface">
            {t('delivery.title')}
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            {t('delivery.description', {
              provider: providerLabel,
              supportDays,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
