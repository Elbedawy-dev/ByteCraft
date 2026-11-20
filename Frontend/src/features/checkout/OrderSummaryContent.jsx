import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Input } from '@/components/ui';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { contactPath } from '@/config/routes';
import { buildWhatsAppUrl } from './checkoutSchema';

/**
 * Reusable Order Summary body (project preview, package, deliverables,
 * server-validated coupon box, tax-free server pricing, and engineer support).
 * Rendered inside both the desktop sticky sidebar and the mobile collapsible summary.
 */
export function OrderSummaryContent({
  idPrefix = 'desktop',
  project,
  selectedPackage,
  pricing,
  couponCodeInput,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon = false,
  couponError = '',
  appliedPricing = null,
  contactMeta,
}) {
  const { t } = useTranslation('checkout');
  const { lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);

  const title = localized(project?.title, lang);
  const categoryName = localized(project?.category?.name, lang);
  const packageName = localized(selectedPackage?.name, lang);
  const licenseType = selectedPackage?.licenseType === 'multi' ? 'multi' : 'single';
  const supportDays = selectedPackage?.supportDays ?? 30;

  const deliverables =
    Array.isArray(selectedPackage?.features) && selectedPackage.features.length > 0
      ? selectedPackage.features
      : Array.isArray(project?.features)
        ? project.features
        : [];

  const thumbnailUrl = project?.thumbnail?.url;
  const hasCompareAt =
    typeof selectedPackage?.compareAtPrice === 'number' &&
    selectedPackage.compareAtPrice > selectedPackage.price;

  const subtotal = pricing?.subtotal ?? selectedPackage?.price ?? 0;
  const discount = pricing?.discount ?? 0;
  const total = pricing?.total ?? selectedPackage?.price ?? 0;
  const appliedCode = appliedPricing?.couponCode || null;

  const couponInputId = `checkout-coupon-${idPrefix}`;
  const couponMsgId = `checkout-coupon-msg-${idPrefix}`;
  const whatsAppUrl = buildWhatsAppUrl(contactMeta?.whatsapp);

  const handleCouponKeyDown = (event) => {
    if (event.key === 'Enter' && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      onApplyCoupon();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Project Mini Preview Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3">
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-surface-container border border-outline-variant/40">
          {thumbnailUrl && !imgFailed ? (
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high text-primary/70">
              <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
                deployed_code
              </span>
            </div>
          )}

          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {categoryName && (
            <span className="absolute top-2.5 start-2.5 bg-surface-container-highest/90 backdrop-blur-md text-primary text-[11px] font-semibold px-2.5 py-1 rounded-md border border-outline-variant/60 max-w-[85%] truncate">
              {categoryName}
            </span>
          )}

          <p className="absolute bottom-2.5 inset-x-3 text-sm sm:text-base font-bold text-white drop-shadow line-clamp-1">
            {title}
          </p>
        </div>

        <div className="flex items-start justify-between gap-3 pt-0.5">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-on-surface truncate">
              {packageName}
            </span>
            <span className="text-xs text-on-surface-variant mt-0.5">
              {t(`summary.licenseTypes.${licenseType}`)}
            </span>
            <div className="mt-1.5">
              <Badge variant="neutral" size="sm">
                {t('summary.supportDaysBadge', { days: supportDays })}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 text-end">
            <span className="text-sm sm:text-base font-bold text-primary">
              {selectedPackage?.price === 0
                ? t('summary.freeValue')
                : formatMoney(selectedPackage?.price ?? 0, lang)}
            </span>
            {hasCompareAt && (
              <span className="text-xs text-outline line-through mt-0.5">
                {formatMoney(selectedPackage.compareAtPrice, lang)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Included Package Deliverables */}
      {deliverables.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm font-bold text-on-surface">
            {t('summary.deliverablesTitle')}
          </span>
          <ul className="flex flex-col gap-2">
            {deliverables.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed"
              >
                <span
                  className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span className="text-on-surface">{localized(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coupon Validation Box (Server Pricing Preview Only) */}
      <div className="pt-3 border-t border-outline-variant/60">
        <label
          htmlFor={couponInputId}
          className="block text-xs sm:text-sm font-medium text-on-surface-variant mb-2"
        >
          {t('coupon.label')}
        </label>

        {appliedCode ? (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="material-symbols-outlined text-primary text-[18px] shrink-0"
                aria-hidden="true"
              >
                confirmation_number
              </span>
              <span className="text-xs sm:text-sm font-semibold text-on-surface truncate">
                <bdi dir="ltr" className="font-code text-primary">
                  {appliedCode}
                </bdi>
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveCoupon}
              className="text-error hover:text-error hover:bg-error/10 h-8 px-2.5 shrink-0"
            >
              {t('coupon.remove')}
            </Button>
          </div>
        ) : (
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0">
              <Input
                id={couponInputId}
                type="text"
                dir="ltr"
                value={couponCodeInput}
                onChange={(e) => onCouponInputChange(e.target.value)}
                onKeyDown={handleCouponKeyDown}
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder={t('coupon.placeholder')}
                error={Boolean(couponError)}
                aria-describedby={couponError ? couponMsgId : undefined}
                className="uppercase font-code tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-outline text-start"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={isApplyingCoupon}
              onClick={onApplyCoupon}
              className="shrink-0 px-4 sm:px-5"
            >
              {t('coupon.apply')}
            </Button>
          </div>
        )}

        {couponError ? (
          <p
            id={couponMsgId}
            role="alert"
            className="text-xs text-error mt-2 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px] shrink-0" aria-hidden="true">
              error
            </span>
            <span>{couponError}</span>
          </p>
        ) : appliedCode ? (
          <p
            id={couponMsgId}
            role="status"
            className="text-xs text-primary mt-2 font-medium flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px] shrink-0" aria-hidden="true">
              check_circle
            </span>
            <span>{t('coupon.appliedSuccess', { code: appliedCode })}</span>
          </p>
        ) : null}
      </div>

      {/* Authoritative Tax-Free Pricing Breakdown (Never computed locally, never displays VAT) */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-outline-variant/60">
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-on-surface-variant">
          <span>{t('summary.subtotalLabel')}</span>
          <span className="text-on-surface font-semibold">
            {formatMoney(subtotal, lang)}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-primary">
            <span className="truncate">
              {t('summary.discountLabel', { code: appliedCode || '' })}
            </span>
            <span className="font-semibold shrink-0">
              <bdi dir="ltr">-{formatMoney(discount, lang)}</bdi>
            </span>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-outline-variant/60 mt-1">
          <span className="text-base sm:text-lg font-extrabold text-on-surface">
            {t('summary.totalLabel')}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            {total === 0 ? t('summary.freeValue') : formatMoney(total, lang)}
          </span>
        </div>
      </div>

      {/* Pre-sale Direct Engineer Support Box */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              support_agent
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
              {t('summary.supportCardTitle')}
            </span>
            <span className="text-xs text-on-surface-variant truncate">
              {t('summary.supportCardSubtitle')}
            </span>
          </div>
        </div>

        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold text-primary transition-colors shrink-0 min-h-[40px]"
          >
            <span>{t('summary.whatsappAction')}</span>
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              open_in_new
            </span>
          </a>
        ) : (
          <Link
            to={contactPath({ project: project?.slug })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold text-primary transition-colors shrink-0 min-h-[40px]"
          >
            <span>{t('summary.contactAction')}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
